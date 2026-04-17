import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, AlertCircle, AlertTriangle, CheckCircle2,
  List, ImageIcon, PenLine, Trash2, Edit2, X, Plus, RefreshCw,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { Header } from '@/app/components/Header';
import { supabase } from '@/lib/supabase';
import { analyzePdfFile, type PropertyExtractedData, type AnalysisWarning } from '@/lib/analyze-pdf';
import { extractPropertyFieldsFromText } from '@/lib/extract-property-fields-from-text';
import { yearsToBuildingAgeBand, bandToRepresentativeYears } from '@/lib/buildingAgeBand';
import { pickTextFromArrayOrScalar, sanitizePropertiesWritePayload } from '@/lib/properties';
import type { Page } from '@/lib/routes';
import { useCurrency } from '@/app/contexts/CurrencyContext';

// ─── 型定義 ────────────────────────────────────────────────────────────────
type Mode      = 'pdf' | 'manual' | 'list' | 'images';
type ManualStep = 'form' | 'success';
type BatchStatus = 'waiting' | 'processing' | 'extracted' | 'saving' | 'saved' | 'error';

interface PropertyRegisterPageProps {
  onNavigate: (page: Page) => void;
}

type FormData = PropertyExtractedData & {
  image?: string;
  property_category?: string;
  region_group?: string;
  /** DB の building_age_band をそのまま保持（自由記述のとき用） */
  building_age_band?: string | null;
};

interface PropertyRow {
  id: number;
  title: string;
  address: string;
  price: number;
  type: 'rent' | 'buy';
  image: string;
  images: string[] | null;
  source_pdf_path?: string | null;
  [key: string]: unknown;
}

interface BatchItem {
  id: string;
  filename: string;
  file: File;
  status: BatchStatus;
  formData: FormData;
  warnings: AnalysisWarning[];
  errorMsg?: string;
  expanded: boolean;
}

// ─── 定数 ──────────────────────────────────────────────────────────────────
const PROPERTY_CATEGORIES = [
  { value: 'bldg',      label: 'ビル・マンション一棟' },
  { value: 'room',      label: 'マンション一室・フロア' },
  { value: 'hotel',     label: 'ホテル・旅館' },
  { value: 'land',      label: '土地・事業用地' },
  { value: 'apartment', label: '収益アパート' },
  { value: 'golf',      label: 'ゴルフ場' },
  { value: 'medical',   label: '病院・医療施設' },
] as const;

/** 物件名に応じて property_category を推定（用地・土地 → ゴルフ → ホテル → 連続3桁以上の数字） */
function inferPropertyCategoryFromTitle(title: string): string | undefined {
  const t = String(title ?? '').trim();
  if (!t) return undefined;
  if (/(用地|土地)/.test(t)) return 'land';
  if (/ゴルフ/.test(t)) return 'golf';
  if (/ホテル/.test(t)) return 'hotel';
  if (/\d{3,}/.test(t)) return 'room';
  return undefined;
}

const SIDEBAR_ITEMS = [
  { id: 'pdf'    as Mode, label: 'PDF取り込み',   Icon: FileText  },
  { id: 'manual' as Mode, label: '手動登録',      Icon: PenLine   },
  { id: 'list'   as Mode, label: '物件一覧・編集', Icon: List      },
  { id: 'images' as Mode, label: '画像管理',      Icon: ImageIcon },
];

// ─── ヘルパー ───────────────────────────────────────────────────────────────
function buildPropertyInformation(formData: FormData): string {
  const parts: string[] = [];
  if (formData.cap_rate    != null) parts.push(`利回り: ${formData.cap_rate}%`);
  if (formData.building_age != null) parts.push(`築年数: ${formData.building_age}年`);
  if (formData.land_area   != null) parts.push(`土地面積: ${formData.land_area}㎡`);
  if (formData.rights)              parts.push(`権利関係: ${formData.rights}`);
  if (formData.land_type)           parts.push(`地目: ${formData.land_type}`);
  if (formData.zoning)              parts.push(`用途地域: ${formData.zoning}`);
  if (formData.planning_area)       parts.push(`区域区分: ${formData.planning_area}`);
  const base = formData.property_information ?? '';
  return parts.length > 0 ? `${parts.join(' ／ ')}${base ? '\n' + base : ''}` : base;
}

/** 備考にだけ書かれている既存データを、フォーム初期値用にざっくり解析 */
function parseHintsFromPropertyInformation(base: string | null | undefined): Partial<FormData> {
  const t = (base ?? '').trim();
  if (!t) return {};
  const out: Partial<FormData> = {};
  const cap =
    t.match(/(?:表面|想定|満室時|実質)?利回り[：:\s]*([0-9]+(?:\.[0-9]+)?)/) ||
    t.match(/利回り[：:\s]*([0-9]+(?:\.[0-9]+)?)/);
  if (cap) {
    const n = parseFloat(cap[1]);
    if (Number.isFinite(n)) out.cap_rate = n;
  }
  const age = t.match(/築年数[：:\s]*([0-9]{1,3})/) || t.match(/築\s*([0-9]{1,3})\s*年/);
  if (age) {
    const n = parseInt(age[1], 10);
    if (Number.isFinite(n)) out.building_age = n;
  }
  const rightsM = t.match(/権利関係[：:\s]*([^\n／]+)/);
  if (rightsM) out.rights = rightsM[1].trim();
  const landM = t.match(/地目[：:\s]*([^\n／]+)/);
  if (landM) out.land_type = landM[1].trim();
  const zoneM = t.match(/用途地域[：:\s]*([^\n／]+)/);
  if (zoneM) out.zoning = zoneM[1].trim();
  const planM = t.match(/区域区分[：:\s]*([^\n／]+)/);
  if (planM) out.planning_area = planM[1].trim();
  return out;
}

function buildRow(formData: FormData) {
  return {
    title:                    formData.title    ?? '',
    address:                  formData.address  ?? '',
    type:                     formData.type     ?? 'buy',
    station:                  formData.station  ?? '',
    layout:                   formData.layout   ?? '',
    image:                    formData.image    ?? '',
    images:                   [] as string[],
    price:                    Number(formData.price)           || 0,
    beds:                     Number(formData.beds)            || 0,
    size:                     Number(formData.size)            || 0,
    building_area_sqm:
      formData.size != null && formData.size !== '' && Number.isFinite(Number(formData.size))
        ? Number(formData.size)
        : null,
    walking_minutes:          Number(formData.walking_minutes) || 0,
    floor:                    formData.floor          ? Number(formData.floor)          : null,
    management_fee:           formData.management_fee ? Number(formData.management_fee) : null,
    deposit:                  formData.deposit        ? Number(formData.deposit)        : null,
    key_money:                formData.key_money      ? Number(formData.key_money)      : null,
    latitude:                 formData.latitude       ? Number(formData.latitude)       : null,
    longitude:                formData.longitude      ? Number(formData.longitude)      : null,
    pet_friendly:             formData.pet_friendly             ?? false,
    foreign_friendly:         false,
    elevator:                 formData.elevator                 ?? false,
    delivery_box:             formData.delivery_box             ?? false,
    balcony:                  formData.balcony                  ?? false,
    bicycle_parking:          formData.bicycle_parking          ?? false,
    south_facing:             formData.south_facing             ?? false,
    initial_fees_credit_card: formData.initial_fees_credit_card ?? false,
    is_featured:              formData.is_featured              ?? false,
    is_new:                   formData.is_new                   ?? true,
    property_category:        formData.property_category || 'bldg',
    region_group:             formData.region_group      || 'tokyo23',
    cap_rate:                 formData.cap_rate != null && formData.cap_rate !== '' ? Number(formData.cap_rate) : null,
    ...(() => {
      const ageNum =
        formData.building_age != null && formData.building_age !== ''
          ? Number(formData.building_age)
          : NaN;
      const fromAge = yearsToBuildingAgeBand(ageNum);
      const rawBand =
        formData.building_age_band != null ? String(formData.building_age_band).trim() : '';
      const building_age_band = Number.isFinite(ageNum)
        ? fromAge
        : rawBand !== ''
          ? rawBand
          : null;
      return { building_age_band };
    })(),
    property_information:     buildPropertyInformation(formData) || null,
    // ダッシュボードスキーマの text[]（マイグレーション 20260406130000 で追加）
    ...(() => {
      const rStr = formData.rights?.trim() || null;
      const lStr = formData.land_type?.trim() || null;
      const zStr = formData.zoning?.trim() || null;
      const pStr = formData.planning_area?.trim() || null;
      return {
        rights_relation: rStr ? [rStr] : ([] as string[]),
        land_category: lStr ? [lStr] : ([] as string[]),
        zoning_types: zStr ? [zStr] : ([] as string[]),
        planning_areas: pStr ? [pStr] : ([] as string[]),
      };
    })(),
    land_area_sqm:
      formData.land_area != null && formData.land_area !== '' && Number.isFinite(Number(formData.land_area))
        ? Number(formData.land_area)
        : null,
  };
}

function normalizePropertyTitle(title: string): string {
  return String(title ?? '')
    .trim()
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** 階数の比較用（未入力同士は同じ階なしとして一致） */
function floorMatchKey(floor: number | null | undefined): string {
  if (floor === null || floor === undefined || Number.isNaN(Number(floor))) return '__none__';
  return String(Number(floor));
}

async function findDuplicatePropertyId(
  title: string,
  floor: number | null | undefined,
  type: 'rent' | 'buy',
): Promise<number | null> {
  const tKey = normalizePropertyTitle(title);
  if (!tKey) return null;
  const fKey = floorMatchKey(floor);
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, floor')
    .eq('type', type);
  if (error || !data?.length) return null;
  for (const p of data as { id: number; title: string | null; floor: number | null }[]) {
    if (normalizePropertyTitle(String(p.title ?? '')) !== tKey) continue;
    if (floorMatchKey(p.floor) !== fKey) continue;
    return Number(p.id);
  }
  return null;
}

async function uploadPropertyPdf(propertyId: number, file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document.pdf';
  const storagePath = `${propertyId}/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage
    .from('property-pdfs')
    .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
  if (upErr) throw upErr;
  return storagePath;
}

// ─── メインコンポーネント ────────────────────────────────────────────────────
export function PropertyRegisterPage({ onNavigate }: PropertyRegisterPageProps) {
  const { formatPrice } = useCurrency();

  // ── モード ───────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('pdf');

  // ── 手動登録フォーム ─────────────────────────────────────────────────────
  const [manualStep,  setManualStep]  = useState<ManualStep>('form');
  const [warnings,    setWarnings]    = useState<AnalysisWarning[]>([]);
  const [formData,    setFormData]    = useState<FormData>({});
  const [saving,      setSaving]      = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [editingId,   setEditingId]   = useState<number | null>(null);

  // ── PDFバッチ ────────────────────────────────────────────────────────────
  const [batchItems,   setBatchItems]   = useState<BatchItem[]>([]);
  const [isDragging,   setIsDragging]   = useState(false);
  const [isSavingAll,  setIsSavingAll]  = useState(false);
  /** 物件名+階+種別が既存と重複したとき、上書き/削除の選択用（このときだけ表示） */
  const [duplicateModal, setDuplicateModal] = useState<
    | null
    | { kind: 'batch'; batchItemId: string; dupId: number; row: ReturnType<typeof buildRow>; file: File }
    | { kind: 'manual'; dupId: number; row: ReturnType<typeof buildRow> }
  >(null);
  const [duplicateActionLoading, setDuplicateActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 物件一覧 ─────────────────────────────────────────────────────────────
  const [propertyList,    setPropertyList]    = useState<PropertyRow[]>([]);
  const [listLoading,     setListLoading]     = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [enrichingId,     setEnrichingId]     = useState<number | null>(null);

  // ── 画像管理 ─────────────────────────────────────────────────────────────
  const [imgPropId,     setImgPropId]     = useState<number | ''>('');
  const [imagesList,    setImagesList]    = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imgUploading,  setImgUploading]  = useState(false);
  const [imgSaving,     setImgSaving]     = useState(false);
  const [imgSaved,      setImgSaved]      = useState(false);
  const imgFileRef = useRef<HTMLInputElement>(null);

  // ── DB取得 ───────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setListLoading(true);
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('id', { ascending: false });
    if (data) setPropertyList(data as PropertyRow[]);
    setListLoading(false);
  }, []);

  useEffect(() => {
    if (mode === 'list' || mode === 'images') fetchList();
  }, [mode, fetchList]);

  // 画像管理：物件選択時
  useEffect(() => {
    if (imgPropId === '') { setImagesList([]); return; }
    const prop = propertyList.find(p => p.id === Number(imgPropId));
    if (!prop) return;
    const all = [prop.image, ...(prop.images ?? [])].filter(Boolean) as string[];
    setImagesList(all);
    setImgSaved(false);
    setImageUrlInput('');
    setErrorMsg(null);
  }, [imgPropId, propertyList]);

  // ── PDFバッチ処理 ────────────────────────────────────────────────────────
  const processBatchItem = useCallback(async (item: BatchItem) => {
    setBatchItems(prev => prev.map(b =>
      b.id === item.id ? { ...b, status: 'processing', errorMsg: undefined, warnings: [] } : b
    ));
    try {
      const result = await analyzePdfFile(item.file);
      setBatchItems(prev => prev.map(b =>
        b.id === item.id ? {
          ...b,
          status: 'extracted',
          formData: (() => {
            const base = { ...result.data, image: '' } as FormData;
            const cat = inferPropertyCategoryFromTitle(String(base.title ?? ''));
            return cat != null ? { ...base, property_category: cat } : base;
          })(),
          warnings: result.warnings,
        } : b
      ));
    } catch (err) {
      setBatchItems(prev => prev.map(b =>
        b.id === item.id ? {
          ...b,
          status: 'error',
          errorMsg: err instanceof Error ? err.message : 'PDF解析に失敗しました',
        } : b
      ));
    }
  }, []);

  const retryBatchExtract = useCallback(async (id: string) => {
    const item = batchItems.find(b => b.id === id);
    if (!item || item.status !== 'error') return;
    await processBatchItem(item);
  }, [batchItems, processBatchItem]);

  const addFilesToBatch = useCallback(async (files: File[]) => {
    const valid = files.filter(f => f.type.includes('pdf') || f.name.endsWith('.pdf'));
    if (valid.length === 0) return;
    const newItems: BatchItem[] = valid.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      filename: file.name,
      file,
      status: 'waiting' as BatchStatus,
      formData: {},
      warnings: [],
      expanded: false,
    }));
    setBatchItems(prev => [...prev, ...newItems]);
    // 順番に処理
    for (const item of newItems) {
      await processBatchItem(item);
    }
  }, [processBatchItem]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addFilesToBatch(files);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFilesToBatch(files);
  }, [addFilesToBatch]);

  const updateBatchField = (id: string, key: keyof FormData, value: unknown) => {
    setBatchItems(prev => prev.map(b =>
      b.id === id ? { ...b, formData: { ...b.formData, [key]: value === '' ? null : value } } : b
    ));
  };

  const toggleBatchExpand = (id: string) => {
    setBatchItems(prev => prev.map(b =>
      b.id === id ? { ...b, expanded: !b.expanded } : b
    ));
  };

  /** @returns 重複モーダルを出したとき true（一括登録はここで打ち切り） */
  const saveBatchItem = async (id: string): Promise<boolean> => {
    const item = batchItems.find(b => b.id === id);
    if (!item || item.status !== 'extracted') return false;
    setBatchItems(prev => prev.map(b => b.id === id ? { ...b, status: 'saving' } : b));
    try {
      const row = buildRow(item.formData);
      const ptype = (row.type as 'rent' | 'buy') || 'buy';
      const dupId = await findDuplicatePropertyId(row.title ?? '', row.floor, ptype);

      if (dupId != null) {
        setBatchItems(prev => prev.map(b => b.id === id ? { ...b, status: 'extracted' } : b));
        setDuplicateModal({ kind: 'batch', batchItemId: id, dupId, row, file: item.file });
        return true;
      }

      const { data: inserted, error } = await supabase.from('properties').insert([row]).select('id').single();
      if (error) throw error;
      const pid = inserted?.id;
      if (pid == null) throw new Error('保存後に ID を取得できませんでした');

      const storagePath = await uploadPropertyPdf(pid, item.file);
      const { error: metaErr } = await supabase
        .from('properties')
        .update({ source_pdf_path: storagePath })
        .eq('id', pid);
      if (metaErr) {
        await supabase.storage.from('property-pdfs').remove([storagePath]);
        await supabase.from('properties').delete().eq('id', pid);
        throw metaErr;
      }

      setBatchItems(prev => prev.map(b =>
        b.id === id ? { ...b, status: 'saved', expanded: false } : b
      ));
      void fetchList();
      return false;
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? [(err as { message?: string; details?: string; hint?: string }).message,
           (err as { message?: string; details?: string; hint?: string }).details,
           (err as { message?: string; details?: string; hint?: string }).hint,
          ].filter(Boolean).join(' / ')
        : err instanceof Error ? err.message : '保存に失敗しました';
      setBatchItems(prev => prev.map(b =>
        b.id === id ? { ...b, status: 'error', errorMsg: msg } : b
      ));
      return false;
    }
  };

  const saveAllBatchItems = async () => {
    const toSave = batchItems.filter(b => b.status === 'extracted');
    if (toSave.length === 0) return;
    setIsSavingAll(true);
    for (const item of toSave) {
      const openedModal = await saveBatchItem(item.id);
      if (openedModal) break;
    }
    setIsSavingAll(false);
  };

  const closeDuplicateModal = () => {
    if (!duplicateActionLoading) setDuplicateModal(null);
  };

  const applyDuplicateOverwrite = async () => {
    if (!duplicateModal) return;
    const payload = duplicateModal;
    setDuplicateActionLoading(true);
    try {
      if (payload.kind === 'batch') {
        const { batchItemId, dupId, row, file } = payload;
        setDuplicateModal(null);
        setBatchItems(prev => prev.map(b => b.id === batchItemId ? { ...b, status: 'saving' } : b));
        const { data: oldMeta } = await supabase
          .from('properties')
          .select('source_pdf_path')
          .eq('id', dupId)
          .single();
        const oldPdf = oldMeta?.source_pdf_path != null ? String(oldMeta.source_pdf_path) : '';
        const newPath = await uploadPropertyPdf(dupId, file);
        const { error: updErr } = await supabase
          .from('properties')
          .update(sanitizePropertiesWritePayload({ ...row, source_pdf_path: newPath }))
          .eq('id', dupId);
        if (updErr) {
          await supabase.storage.from('property-pdfs').remove([newPath]);
          throw updErr;
        }
        if (oldPdf && oldPdf !== newPath) {
          await supabase.storage.from('property-pdfs').remove([oldPdf]);
        }
        setBatchItems(prev => prev.map(b =>
          b.id === batchItemId ? { ...b, status: 'saved', expanded: false } : b
        ));
        void fetchList();
      } else {
        const { dupId, row } = payload;
        setDuplicateModal(null);
        const { error } = await supabase.from('properties').update(sanitizePropertiesWritePayload(row)).eq('id', dupId);
        if (error) throw error;
        setManualStep('success');
        void fetchList();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      if (payload.kind === 'batch') {
        setBatchItems(prev => prev.map(b =>
          b.id === payload.batchItemId ? { ...b, status: 'error', errorMsg: msg } : b
        ));
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setDuplicateActionLoading(false);
    }
  };

  const applyDuplicateDeleteReplace = async () => {
    if (!duplicateModal) return;
    const payload = duplicateModal;
    setDuplicateActionLoading(true);
    try {
      if (payload.kind === 'batch') {
        const { batchItemId, dupId, row, file } = payload;
        setDuplicateModal(null);
        setBatchItems(prev => prev.map(b => b.id === batchItemId ? { ...b, status: 'saving' } : b));
        const { data: dupMeta } = await supabase
          .from('properties')
          .select('source_pdf_path')
          .eq('id', dupId)
          .single();
        const dupPdf = dupMeta?.source_pdf_path != null ? String(dupMeta.source_pdf_path) : '';
        if (dupPdf) await supabase.storage.from('property-pdfs').remove([dupPdf]);
        const { error: delErr } = await supabase.from('properties').delete().eq('id', dupId);
        if (delErr) throw delErr;

        const { data: inserted, error } = await supabase
          .from('properties')
          .insert([sanitizePropertiesWritePayload(row)])
          .select('id')
          .single();
        if (error) throw error;
        const pid = inserted?.id;
        if (pid == null) throw new Error('保存後に ID を取得できませんでした');
        const storagePath = await uploadPropertyPdf(pid, file);
        const { error: metaErr } = await supabase
          .from('properties')
          .update({ source_pdf_path: storagePath })
          .eq('id', pid);
        if (metaErr) {
          await supabase.storage.from('property-pdfs').remove([storagePath]);
          await supabase.from('properties').delete().eq('id', pid);
          throw metaErr;
        }
        setBatchItems(prev => prev.map(b =>
          b.id === batchItemId ? { ...b, status: 'saved', expanded: false } : b
        ));
        void fetchList();
      } else {
        const { dupId, row } = payload;
        setDuplicateModal(null);
        const { data: dupMeta } = await supabase
          .from('properties')
          .select('source_pdf_path')
          .eq('id', dupId)
          .single();
        const dupPdf = dupMeta?.source_pdf_path != null ? String(dupMeta.source_pdf_path) : '';
        if (dupPdf) await supabase.storage.from('property-pdfs').remove([dupPdf]);
        const { error: delErr } = await supabase.from('properties').delete().eq('id', dupId);
        if (delErr) throw delErr;
        const { error } = await supabase.from('properties').insert([sanitizePropertiesWritePayload(row)]);
        if (error) throw error;
        setManualStep('success');
        void fetchList();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      if (payload.kind === 'batch') {
        setBatchItems(prev => prev.map(b =>
          b.id === payload.batchItemId ? { ...b, status: 'error', errorMsg: msg } : b
        ));
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setDuplicateActionLoading(false);
    }
  };

  // ── 手動フォーム操作 ─────────────────────────────────────────────────────
  const updateField = (key: keyof FormData, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value === '' ? null : value }));

  const handleSave = async () => {
    setSaving(true); setErrorMsg(null);
    try {
      const row = sanitizePropertiesWritePayload(buildRow(formData) as Record<string, unknown>);
      const ptype = (row.type as 'rent' | 'buy') || 'buy';

      if (editingId != null) {
        const { error } = await supabase.from('properties').update(row).eq('id', editingId);
        if (error) throw error;
      } else {
        const dupId = await findDuplicatePropertyId(row.title ?? '', row.floor, ptype);
        if (dupId != null) {
          setDuplicateModal({ kind: 'manual', dupId, row });
          return;
        }
        const { error } = await supabase.from('properties').insert([row]);
        if (error) throw error;
      }

      setManualStep('success');
      void fetchList();
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        const e = err as { message?: string; details?: string; hint?: string };
        setErrorMsg([e.message, e.details, e.hint].filter(Boolean).join(' / ') || '保存に失敗しました');
      } else {
        setErrorMsg(err instanceof Error ? err.message : '保存に失敗しました');
      }
    } finally { setSaving(false); }
  };

  const handleEditProperty = (prop: PropertyRow) => {
    const d = prop as Record<string, unknown>;
    const bandFromDb =
      d.building_age_band != null ? String(d.building_age_band).trim() : '';
    const repFromBand = bandToRepresentativeYears(bandFromDb);
    const hints = parseHintsFromPropertyInformation(
      d.property_information != null ? String(d.property_information) : '',
    );
    setFormData({
      title:                    String(d.title   ?? ''),
      address:                  String(d.address ?? ''),
      type:                     (d.type as 'rent' | 'buy') ?? 'buy',
      station:                  String(d.station ?? ''),
      layout:                   String(d.layout  ?? ''),
      image:                    String(d.image   ?? ''),
      price:                    Number(d.price)  || 0,
      beds:                     Number(d.beds)   || 0,
      size:
        Number(d.size) ||
        Number(d.building_area_sqm) ||
        0,
      walking_minutes:          Number(d.walking_minutes) || 0,
      floor:                    d.floor          != null ? Number(d.floor)          : null,
      management_fee:           d.management_fee != null ? Number(d.management_fee) : null,
      deposit:                  d.deposit        != null ? Number(d.deposit)        : null,
      key_money:                d.key_money      != null ? Number(d.key_money)      : null,
      latitude:                 d.latitude       != null ? Number(d.latitude)       : null,
      longitude:                d.longitude      != null ? Number(d.longitude)      : null,
      pet_friendly:             Boolean(d.pet_friendly),
      elevator:                 Boolean(d.elevator),
      delivery_box:             Boolean(d.delivery_box),
      balcony:                  Boolean(d.balcony),
      bicycle_parking:          Boolean(d.bicycle_parking),
      south_facing:             Boolean(d.south_facing),
      initial_fees_credit_card: Boolean(d.initial_fees_credit_card),
      is_featured:              Boolean(d.is_featured),
      is_new:                   Boolean(d.is_new),
      property_category: (() => {
        const fromTitle = inferPropertyCategoryFromTitle(String(d.title ?? ''));
        return fromTitle ?? String(d.property_category ?? 'bldg');
      })(),
      region_group:             String(d.region_group      ?? 'tokyo23'),
      property_information:     d.property_information != null ? String(d.property_information) : null,
      cap_rate:                 d.cap_rate != null && d.cap_rate !== '' ? Number(d.cap_rate) : hints.cap_rate,
      building_age_band:
        repFromBand != null ? undefined : bandFromDb !== '' ? bandFromDb : undefined,
      building_age:
        repFromBand ??
        (d.building_age != null && d.building_age !== '' && Number.isFinite(Number(d.building_age))
          ? Number(d.building_age)
          : hints.building_age),
      rights:                   pickTextFromArrayOrScalar(d, 'rights_relation', 'rights') ?? hints.rights,
      land_type:                pickTextFromArrayOrScalar(d, 'land_category', 'land_type') ?? hints.land_type,
      zoning:                   pickTextFromArrayOrScalar(d, 'zoning_types', 'zoning') ?? hints.zoning,
      planning_area:            pickTextFromArrayOrScalar(d, 'planning_areas', 'planning_area') ?? hints.planning_area,
      land_area:
        d.land_area_sqm != null && d.land_area_sqm !== '' && Number.isFinite(Number(d.land_area_sqm))
          ? Number(d.land_area_sqm)
          : hints.land_area,
    });
    setEditingId(prop.id);
    setWarnings([]);
    setErrorMsg(null);
    setManualStep('form');
    setMode('manual');
  };

  const handleEnrichFromNotes = async (prop: PropertyRow) => {
    const d = prop as Record<string, unknown>;
    const text = d.property_information != null ? String(d.property_information).trim() : '';
    if (!text) {
      setErrorMsg('備考・特記事項が空のため解析できません。');
      return;
    }
    setEnrichingId(prop.id);
    setErrorMsg(null);
    try {
      const ex = await extractPropertyFieldsFromText(text);
      const patch: Record<string, unknown> = { cap_rate: ex.cap_rate };
      if (ex.rights != null && String(ex.rights).trim() !== '') {
        patch.rights_relation = [String(ex.rights).trim()];
      }
      if (ex.land_type != null && String(ex.land_type).trim() !== '') {
        patch.land_category = [String(ex.land_type).trim()];
      }
      if (ex.zoning != null && String(ex.zoning).trim() !== '') {
        patch.zoning_types = [String(ex.zoning).trim()];
      }
      if (ex.planning_area != null && String(ex.planning_area).trim() !== '') {
        patch.planning_areas = [String(ex.planning_area).trim()];
      }
      if (ex.building_age != null && Number.isFinite(Number(ex.building_age))) {
        patch.building_age_band = yearsToBuildingAgeBand(Number(ex.building_age));
      }
      const { error } = await supabase
        .from('properties')
        .update(sanitizePropertiesWritePayload(patch))
        .eq('id', prop.id);
      if (error) throw error;
      await fetchList();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '備考からの抽出に失敗しました');
    } finally {
      setEnrichingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    const row = propertyList.find(p => p.id === id);
    const pdfPath = row?.source_pdf_path;
    if (pdfPath) {
      await supabase.storage.from('property-pdfs').remove([pdfPath]);
    }
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (!error) setPropertyList(prev => prev.filter(p => p.id !== id));
    setDeleteConfirmId(null);
    setDeleting(false);
  };

  const resetManualForm = () => {
    setManualStep('form');
    setFormData({}); setWarnings([]); setErrorMsg(null); setEditingId(null);
  };

  const switchMode = (m: Mode) => {
    setMode(m); setErrorMsg(null); setEditingId(null);
    setFormData({}); setWarnings([]);
    setManualStep('form');
  };

  // ── 画像アップロード ─────────────────────────────────────────────────────
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || imgPropId === '') return;
    e.target.value = '';
    setImgUploading(true); setErrorMsg(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${imgPropId}/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage
        .from('property-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('property-images').getPublicUrl(data.path);
      setImagesList(prev => [...prev, publicUrl]);
      setImgSaved(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`アップロードエラー: ${msg}  ※ Supabase Dashboard で "property-images" バケットを作成してください`);
    } finally { setImgUploading(false); }
  };

  const handleSaveImages = async () => {
    if (imgPropId === '') return;
    setImgSaving(true);
    const { error } = await supabase.from('properties')
      .update({ image: imagesList[0] ?? '', images: imagesList.slice(1) })
      .eq('id', Number(imgPropId));
    setImgSaving(false);
    if (error) setErrorMsg(error.message);
    else { setImgSaved(true); fetchList(); }
  };

  // ── スタイル定数 ─────────────────────────────────────────────────────────
  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent';

  // ── バッチステータスバッジ ────────────────────────────────────────────────
  const batchStatusBadge = (status: BatchStatus) => {
    const map: Record<BatchStatus, { label: string; cls: string }> = {
      waiting:    { label: '待機中',    cls: 'bg-gray-100 text-gray-500' },
      processing: { label: '解析中...', cls: 'bg-blue-100 text-blue-600' },
      extracted:  { label: '抽出完了',  cls: 'bg-emerald-100 text-emerald-700' },
      saving:     { label: '保存中...', cls: 'bg-blue-100 text-blue-600' },
      saved:      { label: '登録完了',  cls: 'bg-green-100 text-green-700' },
      error:      { label: 'エラー',    cls: 'bg-red-100 text-red-600' },
    };
    const { label, cls } = map[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cls}`}>
        {(status === 'processing' || status === 'saving') && (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        {status === 'saved' && <CheckCircle2 className="w-3 h-3" />}
        {label}
      </span>
    );
  };

  // ── フォームJSX（手動登録・編集・バッチ展開で共通） ──────────────────────
  const renderForm = (
    data: FormData,
    update: (key: keyof FormData, value: unknown) => void,
    opts: {
      editingId?: number | null;
      warnings?: AnalysisWarning[];
      saving?: boolean;
      errorMsg?: string | null;
      onSave: () => void;
      onCancel: () => void;
      saveLabel?: string;
      cancelLabel?: string;
    },
  ) => {
    const eid    = opts.editingId ?? null;
    const w      = opts.warnings  ?? [];
    const s      = opts.saving    ?? false;
    const em     = opts.errorMsg  ?? null;
    const errW   = w.filter(x => x.level === 'error');
    const warnW  = w.filter(x => x.level === 'warn');

    return (
      <div className="max-w-3xl">
        {/* 編集中バナー */}
        {eid != null && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <Edit2 className="w-4 h-4 flex-shrink-0" />
            <span>編集中: ID {eid}　<button type="button" onClick={() => { setEditingId(null); setMode('list'); }} className="underline ml-2">一覧に戻る</button></span>
          </div>
        )}

        {/* AI警告 */}
        {(errW.length > 0 || warnW.length > 0) && (
          <div className="mb-6 space-y-2">
            {errW.map((x, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">[{x.field}]</span> {x.message}</span>
              </div>
            ))}
            {warnW.map((x, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">[{x.field}]</span> {x.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* エラー */}
        {em && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-wrap">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{em}
          </div>
        )}

        {/* 基本情報 */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">基本情報</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">物件カテゴリ <span className="text-red-500">*</span></label>
                <select value={data.property_category ?? 'bldg'} onChange={e => update('property_category', e.target.value)}
                  className={`${inputClass} bg-white`}>
                  {PROPERTY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">エリア <span className="text-red-500">*</span></label>
                <select value={data.region_group ?? 'tokyo23'} onChange={e => update('region_group', e.target.value)}
                  className={`${inputClass} bg-white`}>
                  <option value="tokyo23">東京23区</option>
                  <option value="tokyo-other">東京23区外</option>
                  <option value="osaka">大阪</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">売買 / 賃貸</label>
                <select value={data.type ?? 'buy'} onChange={e => update('type', e.target.value as 'rent' | 'buy')}
                  className={`${inputClass} bg-white`}>
                  <option value="buy">売買</option>
                  <option value="rent">賃貸</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">売買価格 / 賃料（円）</label>
                <input type="number" value={data.price ?? ''} onChange={e => update('price', e.target.value)}
                  className={inputClass} placeholder="例: 268000000" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">物件名</label>
              <input
                type="text"
                value={data.title ?? ''}
                onChange={e => {
                  const v = e.target.value;
                  update('title', v);
                  const cat = inferPropertyCategoryFromTitle(v);
                  if (cat != null) update('property_category', cat);
                }}
                className={inputClass}
                placeholder="例: ザ・パークハウス高輪タワー 2005号室"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">メイン画像URL</label>
              <input type="text" value={data.image ?? ''} onChange={e => update('image', e.target.value)}
                className={inputClass} placeholder="https://..." />
              <p className="text-xs text-gray-400 mt-1">※ 画像ファイルのアップロードは「画像管理」タブで行えます</p>
            </div>
          </div>
        </section>

        {/* 検索フィルター */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">検索フィルター項目</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">利回り（%）</label>
                <input type="number" step="0.1" value={data.cap_rate ?? ''} onChange={e => update('cap_rate', e.target.value)}
                  className={inputClass} placeholder="例: 5.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">築年数</label>
                <input type="number" value={data.building_age ?? ''} onChange={e => update('building_age', e.target.value)}
                  className={inputClass} placeholder="例: 10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">権利関係</label>
                <input type="text" value={data.rights ?? ''} onChange={e => update('rights', e.target.value)}
                  className={inputClass} placeholder="例: 所有権" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">地目</label>
                <input type="text" value={data.land_type ?? ''} onChange={e => update('land_type', e.target.value)}
                  className={inputClass} placeholder="例: 宅地" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">用途地域</label>
                <input type="text" value={data.zoning ?? ''} onChange={e => update('zoning', e.target.value)}
                  className={inputClass} placeholder="例: 第一種住居地域" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">区域区分</label>
                <input type="text" value={data.planning_area ?? ''} onChange={e => update('planning_area', e.target.value)}
                  className={inputClass} placeholder="例: 市街化区域" />
              </div>
            </div>
          </div>
        </section>

        {/* 場所・アクセス */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">場所・アクセス</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">住所</label>
              <input type="text" value={data.address ?? ''} onChange={e => update('address', e.target.value)}
                className={inputClass} placeholder="例: 東京都港区高輪1丁目4-10" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">最寄り駅</label>
                <input type="text" value={data.station ?? ''} onChange={e => update('station', e.target.value)}
                  className={inputClass} placeholder="例: 白金高輪駅" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">徒歩（分）</label>
                <input type="number" value={data.walking_minutes ?? ''} onChange={e => update('walking_minutes', e.target.value)}
                  className={inputClass} placeholder="例: 2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">階数</label>
                <input type="number" value={data.floor ?? ''} onChange={e => update('floor', e.target.value)}
                  className={inputClass} placeholder="例: 20" />
              </div>
            </div>
          </div>
        </section>

        {/* 面積 */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">面積</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">間取り</label>
                <input type="text" value={data.layout ?? ''} onChange={e => update('layout', e.target.value)}
                  className={inputClass} placeholder="例: 2LDK" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">延床面積（㎡）</label>
                <input type="number" step="any" value={data.size ?? ''} onChange={e => update('size', e.target.value)}
                  className={inputClass} placeholder="例: 67.63" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">土地面積（㎡）</label>
                <input type="number" step="any" value={data.land_area ?? ''} onChange={e => update('land_area', e.target.value)}
                  className={inputClass} placeholder="例: 200.5" />
              </div>
            </div>
          </div>
        </section>

        {/* 契約条件 */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">契約条件</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">管理費（円）</label>
                <input type="number" value={data.management_fee ?? ''} onChange={e => update('management_fee', e.target.value)}
                  className={inputClass} placeholder="例: 28630" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">敷金（円）</label>
                <input type="number" value={data.deposit ?? ''} onChange={e => update('deposit', e.target.value)}
                  className={inputClass} placeholder="例: 300000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">礼金（円）</label>
                <input type="number" value={data.key_money ?? ''} onChange={e => update('key_money', e.target.value)}
                  className={inputClass} placeholder="例: 150000" />
              </div>
            </div>
          </div>
        </section>

        {/* ステータス */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">ステータス</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex gap-6">
              {([
                { key: 'is_featured' as keyof FormData, label: 'おすすめ表示' },
                { key: 'is_new'      as keyof FormData, label: '新着' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <button type="button" onClick={() => update(key, !data[key])}
                    className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${data[key] ? 'bg-[#C1121F]' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* 備考 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">備考・特記事項</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <textarea value={data.property_information ?? ''} onChange={e => update('property_information', e.target.value)}
              rows={4} className={`${inputClass} resize-none`} placeholder="特記事項・備考など" />
            <p className="text-xs text-gray-400 mt-2">※ 利回り・築年数・権利関係・地目・用途地域・区域区分は保存時に自動でここに追記されます</p>
          </div>
        </section>

        {/* ボタン */}
        <div className="flex items-center gap-3 pb-8">
          <button type="button" onClick={opts.onSave} disabled={s}
            className="px-8 py-3 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md">
            {s ? '保存中...' : (opts.saveLabel ?? (eid != null ? '更新する' : 'Supabaseに登録'))}
          </button>
          <button type="button" onClick={opts.onCancel} disabled={s}
            className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            {opts.cancelLabel ?? (eid != null ? '編集をキャンセル' : 'やり直す')}
          </button>
        </div>
      </div>
    );
  };

  // ── 登録完了JSX（手動用） ────────────────────────────────────────────────
  const renderSuccess = () => (
    <div className="max-w-md flex flex-col items-center text-center py-20 gap-5">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {editingId != null ? '更新完了' : '登録完了'}
        </h2>
        <p className="text-sm text-gray-500">物件情報をSupabaseに保存しました。</p>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={resetManualForm}
          className="px-6 py-2.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white font-semibold rounded-xl transition-colors">
          {editingId != null ? '引き続き編集' : '続けて登録'}
        </button>
        <button type="button" onClick={() => switchMode('list')}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
          物件一覧を見る
        </button>
      </div>
    </div>
  );

  // ── バッチ集計 ───────────────────────────────────────────────────────────
  const extractedCount = batchItems.filter(b => b.status === 'extracted').length;
  const savedCount     = batchItems.filter(b => b.status === 'saved').length;
  const errorCount     = batchItems.filter(b => b.status === 'error').length;

  // ─── レンダリング ───────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] min-h-screen bg-gray-100 w-full overflow-x-hidden">
      <Header onNavigate={onNavigate} currentPage="register" />

      <div className="flex pt-20 w-full min-w-0">
        {/* ── サイドバー（デスクトップ） ── */}
        <aside className="hidden md:flex flex-col w-52 min-h-[calc(100vh-5rem)] bg-white border-r border-gray-200 flex-shrink-0 py-6 px-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">物件管理</p>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id} type="button"
                onClick={() => switchMode(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  mode === id ? 'bg-[#C1121F] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── モバイルタブ ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex pb-[env(safe-area-inset-bottom,0px)]">
          {SIDEBAR_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id} type="button"
              onClick={() => switchMode(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                mode === id ? 'text-[#C1121F]' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* ── メインコンテンツ ── */}
        <main className="flex-1 min-w-0 w-full min-h-[calc(100dvh-5rem)] min-h-[calc(100vh-5rem)] bg-white p-4 md:p-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8 box-border">

          {/* ═══ PDF取り込みモード（複数対応） ═══ */}
          {mode === 'pdf' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">PDF取り込み</h1>
              <p className="text-sm text-gray-500 mb-6">物件情報シートPDFを複数まとめてアップロードできます。AIが自動抽出します。</p>

              {/* ドロップゾーン */}
              <div className="max-w-2xl mb-8">
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    isDragging ? 'border-[#C1121F] bg-[#C1121F]/5' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragging ? 'bg-[#C1121F]/10' : 'bg-gray-200'}`}>
                    <Upload className={`w-7 h-7 ${isDragging ? 'text-[#C1121F]' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-800">PDFをドラッグ＆ドロップ</p>
                    <p className="text-sm text-gray-500 mt-1">または<span className="text-[#C1121F] font-medium">クリックして選択</span>　<span className="text-gray-400">（複数選択可）</span></p>
                    <p className="text-xs text-gray-400 mt-3">1ファイル最大20MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} multiple />
                </div>
              </div>

              {/* バッチリスト */}
              {batchItems.length > 0 && (
                <div className="max-w-3xl">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-semibold text-gray-700">処理状況（{batchItems.length}件）</h2>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {extractedCount > 0 && <span className="text-emerald-600 font-medium">抽出完了 {extractedCount}</span>}
                        {savedCount > 0     && <span className="text-green-600 font-medium">登録済 {savedCount}</span>}
                        {errorCount > 0     && <span className="text-red-500 font-medium">エラー {errorCount}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {extractedCount > 0 && (
                        <button type="button" onClick={saveAllBatchItems} disabled={isSavingAll}
                          className="flex items-center gap-2 px-4 py-2 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                          {isSavingAll && <Loader2 className="w-4 h-4 animate-spin" />}
                          全て登録（{extractedCount}件）
                        </button>
                      )}
                      <button type="button" onClick={() => setBatchItems([])}
                        className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                        リセット
                      </button>
                    </div>
                  </div>

                  {/* バッチアイテム */}
                  <div className="space-y-2">
                    {batchItems.map(item => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        {/* カードヘッダー */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.filename}</p>
                            {item.status === 'extracted' && item.formData.title && (
                              <p className="text-xs text-gray-500 truncate">{item.formData.title}　{item.formData.address}</p>
                            )}
                            {item.status === 'saved' && item.formData.title && (
                              <p className="text-xs text-green-600 truncate">{item.formData.title}</p>
                            )}
                          </div>
                          {batchStatusBadge(item.status)}

                          {/* 展開ボタン */}
                          {item.status === 'extracted' && (
                            <button type="button" onClick={() => toggleBatchExpand(item.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors ml-1">
                              {item.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {item.expanded ? '閉じる' : '編集'}
                            </button>
                          )}

                          {/* 個別保存ボタン */}
                          {item.status === 'extracted' && (
                            <button type="button" onClick={() => saveBatchItem(item.id)}
                              className="px-3 py-1.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white text-xs font-semibold rounded-lg transition-colors ml-1">
                              登録
                            </button>
                          )}

                          {/* 削除 */}
                          {(item.status === 'extracted' || item.status === 'saved' || item.status === 'error') && (
                            <button type="button"
                              onClick={() => setBatchItems(prev => prev.filter(b => b.id !== item.id))}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* エラーメッセージ + 再抽出 */}
                        {item.status === 'error' && (
                          <div className="px-4 pb-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex-1 min-w-0 whitespace-pre-wrap break-words">
                              {item.errorMsg?.trim() ? item.errorMsg : 'PDF解析に失敗しました'}
                            </p>
                            <button
                              type="button"
                              onClick={() => { void retryBatchExtract(item.id); }}
                              className="flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors sm:self-start"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              再抽出
                            </button>
                          </div>
                        )}

                        {/* 展開フォーム */}
                        {item.expanded && item.status === 'extracted' && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4 md:p-6">
                            {renderForm(
                              item.formData,
                              (key, val) => updateBatchField(item.id, key, val),
                              {
                                warnings:    item.warnings,
                                saving:      false,
                                onSave:      () => { saveBatchItem(item.id); },
                                onCancel:    () => toggleBatchExpand(item.id),
                                saveLabel:   '登録する',
                                cancelLabel: '閉じる',
                              },
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ 手動登録 / 編集モード ═══ */}
          {mode === 'manual' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {editingId != null ? `物件編集（ID: ${editingId}）` : '手動登録'}
              </h1>
              <p className="text-sm text-gray-500 mb-8">
                {editingId != null ? '物件情報を編集して更新します。' : 'フォームに直接入力して物件を登録します。'}
              </p>
              {manualStep === 'form' && renderForm(
                formData,
                updateField,
                {
                  editingId,
                  warnings,
                  saving,
                  errorMsg,
                  onSave:   handleSave,
                  onCancel: resetManualForm,
                },
              )}
              {manualStep === 'success' && renderSuccess()}
            </>
          )}

          {/* ═══ 物件一覧・編集・削除 ═══ */}
          {mode === 'list' && (
            <>
              {errorMsg && (
                <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-wrap">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">物件一覧</h1>
                  <p className="text-sm text-gray-500">登録済みの物件を編集・削除できます。備考・特記事項のみに情報がある場合は「備考→項目」でAIが利回り等のカラムに反映します。</p>
                </div>
                <button type="button" onClick={fetchList} disabled={listLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
                  更新
                </button>
              </div>

              {listLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : propertyList.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <List className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>登録済みの物件がありません</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-4xl w-full min-w-0">
                  {propertyList.map(prop => (
                    <div
                      key={prop.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0"
                    >
                      <div className="flex gap-3 min-w-0 flex-1">
                        {/* サムネイル */}
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {prop.image ? (
                            <img src={prop.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        {/* 情報 */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold text-gray-900 text-sm break-words line-clamp-2">{prop.title || '（タイトルなし）'}</p>
                          <p className="text-xs text-gray-500 break-words line-clamp-2 mt-0.5">{prop.address}</p>
                          <p className="text-xs text-gray-400 mt-1 break-all">
                            {formatPrice(Number(prop.price) || 0, prop.type === 'buy' ? 'buy' : 'rent')} • {prop.type === 'buy' ? '売買' : '賃貸'} • ID:{prop.id}
                          </p>
                        </div>
                      </div>
                      {/* ボタン */}
                      {deleteConfirmId === prop.id ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:justify-end flex-shrink-0 w-full sm:w-auto pt-1 border-t border-gray-100 sm:border-t-0 sm:pt-0">
                          <span className="text-xs text-red-600 font-medium sm:mr-1">本当に削除しますか？</span>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleDelete(prop.id)} disabled={deleting}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60">
                              {deleting ? '削除中' : '削除'}
                            </button>
                            <button type="button" onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50">
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 justify-end flex-shrink-0 w-full sm:w-auto pt-1 border-t border-gray-100 sm:border-t-0 sm:pt-0 sm:pl-0">
                          <button
                            type="button"
                            disabled={enrichingId === prop.id}
                            onClick={() => { void handleEnrichFromNotes(prop); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-60"
                          >
                            {enrichingId === prop.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            備考→項目
                          </button>
                          <button type="button" onClick={() => handleEditProperty(prop)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> 編集
                          </button>
                          <button type="button" onClick={() => setDeleteConfirmId(prop.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> 削除
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ 画像管理モード ═══ */}
          {mode === 'images' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">画像管理</h1>
              <p className="text-sm text-gray-500 mb-8">既存物件に画像を追加・削除・並び替えできます。</p>

              {/* 物件選択 */}
              <div className="max-w-2xl mb-6">
                <label className="block text-xs font-medium text-gray-600 mb-2">対象物件を選択</label>
                <select
                  value={imgPropId}
                  onChange={e => setImgPropId(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">── 物件を選択してください ──</option>
                  {propertyList.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.id}] {p.title || '（タイトルなし）'} — {p.address}
                    </option>
                  ))}
                </select>
                {listLoading && <p className="text-xs text-gray-400 mt-1">物件リストを取得中...</p>}
              </div>

              {imgPropId !== '' && (
                <div className="max-w-2xl">
                  {/* エラー */}
                  {errorMsg && (
                    <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-wrap">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{errorMsg}
                    </div>
                  )}

                  {/* 現在の画像一覧 */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      現在の画像（{imagesList.length}枚）　※1枚目がメイン画像
                    </p>
                    {imagesList.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        画像がありません
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {imagesList.map((url, i) => (
                          <div key={i} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                            <img src={url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src = '')} />
                            {i === 0 && (
                              <span className="absolute top-1 left-1 bg-[#C1121F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                メイン
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => { setImagesList(prev => prev.filter((_, j) => j !== i)); setImgSaved(false); }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            {/* 並び替えボタン */}
                            <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {i > 0 && (
                                <button type="button" onClick={() => {
                                  setImagesList(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
                                  setImgSaved(false);
                                }} className="flex-1 bg-black/60 text-white text-[10px] rounded py-0.5 hover:bg-black/80">
                                  ←
                                </button>
                              )}
                              {i < imagesList.length - 1 && (
                                <button type="button" onClick={() => {
                                  setImagesList(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
                                  setImgSaved(false);
                                }} className="flex-1 bg-black/60 text-white text-[10px] rounded py-0.5 hover:bg-black/80">
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 画像追加 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 space-y-3">
                    <p className="text-xs font-semibold text-gray-600">画像を追加</p>

                    {/* ファイルアップロード */}
                    <div>
                      <button type="button" onClick={() => imgFileRef.current?.click()} disabled={imgUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
                        <Upload className="w-4 h-4" />
                        {imgUploading ? 'アップロード中...' : 'ファイルを選択してアップロード'}
                      </button>
                      <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                      <p className="text-xs text-gray-400 mt-1">※ Supabase Storage の "property-images" バケットが必要です</p>
                    </div>

                    {/* URL入力 */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={e => setImageUrlInput(e.target.value)}
                        placeholder="画像URLを直接入力..."
                        className={`${inputClass} flex-1`}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && imageUrlInput.trim()) {
                            setImagesList(prev => [...prev, imageUrlInput.trim()]);
                            setImageUrlInput(''); setImgSaved(false);
                          }
                        }}
                      />
                      <button type="button"
                        onClick={() => {
                          if (!imageUrlInput.trim()) return;
                          setImagesList(prev => [...prev, imageUrlInput.trim()]);
                          setImageUrlInput(''); setImgSaved(false);
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-900 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> 追加
                      </button>
                    </div>
                  </div>

                  {/* 保存ボタン */}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleSaveImages} disabled={imgSaving}
                      className="px-8 py-3 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-md">
                      {imgSaving ? '保存中...' : '画像を保存'}
                    </button>
                    {imgSaved && (
                      <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> 保存しました
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {duplicateModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h2 id="duplicate-modal-title" className="text-lg font-bold text-gray-900 mb-2">
              同じ物件の可能性があります
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">物件名</span>・<span className="font-medium">階</span>・<span className="font-medium">売買/賃貸</span>が、既存データと一致しました。
            </p>
            <p className="text-xs text-gray-500 mb-5">
              階が未入力の同士は「階なし」同士として比較します。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={closeDuplicateModal}
                disabled={duplicateActionLoading}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 order-3 sm:order-1"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => { void applyDuplicateDeleteReplace(); }}
                disabled={duplicateActionLoading}
                className="px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-900 text-sm font-semibold hover:bg-orange-100 disabled:opacity-50 order-2"
              >
                {duplicateActionLoading ? '処理中…' : '削除して新規登録'}
              </button>
              <button
                type="button"
                onClick={() => { void applyDuplicateOverwrite(); }}
                disabled={duplicateActionLoading}
                className="px-4 py-2.5 rounded-xl bg-[#C1121F] text-white text-sm font-semibold hover:bg-[#A00F1A] disabled:opacity-50 order-1 sm:order-3"
              >
                {duplicateActionLoading ? '処理中…' : '上書きする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
