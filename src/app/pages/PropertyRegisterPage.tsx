import { useEffect, useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, AlertTriangle, CheckCircle2, Heart, Calendar, User, LogOut, PlusCircle } from 'lucide-react';
import { Header } from '@/app/components/Header';
import { AccountSubHeader } from '@/app/components/AccountSubHeader';
import { supabase } from '@/lib/supabase';
import { analyzePdf, fileToBase64, type PropertyExtractedData, type AnalysisWarning } from '@/lib/analyze-pdf';
import type { Page } from '@/lib/routes';

interface PropertyRegisterPageProps {
  onNavigate: (page: Page) => void;
}

type FormData = PropertyExtractedData & { image?: string };

const BOOL_FIELDS: { key: keyof PropertyExtractedData; label: string }[] = [
  { key: 'pet_friendly',       label: 'ペット可' },
  { key: 'foreign_friendly',   label: '外国人可' },
  { key: 'elevator',           label: 'エレベーター' },
  { key: 'delivery_box',       label: '宅配ボックス' },
  { key: 'balcony',            label: 'バルコニー' },
  { key: 'bicycle_parking',    label: '駐輪場' },
  { key: 'south_facing',       label: '南向き' },
];

const CATEGORY_FIELDS: { key: keyof PropertyExtractedData; label: string }[] = [
  { key: 'category_no_key_money',        label: '礼金なし' },
  { key: 'category_luxury',              label: '高級物件' },
  { key: 'category_pet_friendly',        label: 'ペット可カテゴリ' },
  { key: 'category_for_students',        label: '学生向け' },
  { key: 'category_for_families',        label: 'ファミリー向け' },
  { key: 'category_designers',           label: 'デザイナーズ' },
  { key: 'category_high_rise_residence', label: 'タワーマンション' },
];

export function PropertyRegisterPage({ onNavigate }: PropertyRegisterPageProps) {
  const [step, setStep] = useState<'upload' | 'loading' | 'form' | 'success'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [warnings, setWarnings] = useState<AnalysisWarning[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setUserName('ユーザー');
        return;
      }
      const first = (user.user_metadata?.first_name as string) ?? '';
      const last = (user.user_metadata?.last_name as string) ?? '';
      setUserName([first, last].filter(Boolean).join(' ') || user.email || 'User');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      setErrorMsg('PDFファイルのみ対応しています');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('ファイルサイズは20MB以下にしてください');
      return;
    }
    setErrorMsg(null);
    setStep('loading');
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzePdf(base64, file.name);
      setFormData({ ...result.data, image: '' });
      setWarnings(result.warnings);
      setStep('form');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'PDF解析に失敗しました');
      setStep('upload');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const updateField = (key: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value === '' ? null : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const row = {
        title:                       formData.title ?? '',
        address:                     formData.address ?? '',
        price:                       Number(formData.price) || 0,
        management_fee:              formData.management_fee ? Number(formData.management_fee) : null,
        beds:                        formData.beds ? Number(formData.beds) : null,
        size:                        formData.size ? Number(formData.size) : null,
        layout:                      formData.layout ?? null,
        image:                       formData.image ?? '',
        station:                     formData.station ?? '',
        walking_minutes:             formData.walking_minutes ? Number(formData.walking_minutes) : null,
        type:                        formData.type ?? 'rent',
        floor:                       formData.floor ? Number(formData.floor) : null,
        deposit:                     formData.deposit ? Number(formData.deposit) : null,
        key_money:                   formData.key_money ? Number(formData.key_money) : null,
        pet_friendly:                formData.pet_friendly ?? null,
        foreign_friendly:            formData.foreign_friendly ?? null,
        elevator:                    formData.elevator ?? null,
        delivery_box:                formData.delivery_box ?? null,
        balcony:                     formData.balcony ?? null,
        bicycle_parking:             formData.bicycle_parking ?? null,
        south_facing:                formData.south_facing ?? null,
        is_featured:                 formData.is_featured ?? false,
        is_new:                      formData.is_new ?? true,
        property_information:        formData.property_information ?? null,
        latitude:                    formData.latitude ? Number(formData.latitude) : null,
        longitude:                   formData.longitude ? Number(formData.longitude) : null,
        category_no_key_money:       formData.category_no_key_money ?? null,
        category_luxury:             formData.category_luxury ?? null,
        category_pet_friendly:       formData.category_pet_friendly ?? null,
        category_for_students:       formData.category_for_students ?? null,
        category_for_families:       formData.category_for_families ?? null,
        category_designers:          formData.category_designers ?? null,
        category_high_rise_residence:formData.category_high_rise_residence ?? null,
      };
      const { error } = await supabase.from('properties').insert([row]);
      if (error) throw error;
      setStep('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep('upload');
    setFormData({});
    setWarnings([]);
    setErrorMsg(null);
  };

  const errorWarnings = warnings.filter((w) => w.level === 'error');
  const warnWarnings  = warnings.filter((w) => w.level === 'warn');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} currentPage="register" />
      <AccountSubHeader currentPage="register" onNavigate={onNavigate} userName={userName} onLogout={handleLogout} />

      <div className="flex flex-col md:flex-row pt-20">
        <div className="flex flex-1 min-w-0">
          {/* Sidebar */}
          <aside className="hidden md:flex w-64 min-h-[calc(100vh-5rem)] bg-gray-200 border-r border-gray-300 flex-col flex-shrink-0">
            <nav className="p-3 flex-1 pt-6">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">アカウント</div>
              <button
                type="button"
                onClick={() => onNavigate('favorites')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
              >
                <Heart className="w-5 h-5" />
                お気に入り
              </button>
              <button
                type="button"
                onClick={() => onNavigate('activity')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
              >
                <Calendar className="w-5 h-5" />
                アクティビティ
              </button>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-300/50 mt-1"
              >
                <User className="w-5 h-5" />
                プロフィール
              </button>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mt-4">管理</div>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-300 text-gray-900 font-medium mt-1"
              >
                <PlusCircle className="w-5 h-5 text-[#C1121F]" />
                物件登録
              </button>
            </nav>
            <div className="p-3 border-t border-gray-300 mt-auto space-y-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#C1121F]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{userName || 'ユーザー'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-300/50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-h-[calc(100vh-5rem)] bg-white p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">物件登録</h1>
            <p className="text-sm text-gray-500 mb-8">物件情報シートPDFをアップロードして、自動で情報を抽出・登録します。</p>

            {/* UPLOAD STEP */}
            {step === 'upload' && (
              <div className="max-w-2xl">
                {errorMsg && (
                  <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                    ${isDragging
                      ? 'border-[#C1121F] bg-[#C1121F]/5'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
                  `}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-[#C1121F]/10' : 'bg-gray-200'}`}>
                    <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#C1121F]' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-800">PDFをドラッグ＆ドロップ</p>
                    <p className="text-sm text-gray-500 mt-1">または<span className="text-[#C1121F] font-medium">クリックして選択</span></p>
                    <p className="text-xs text-gray-400 mt-3">REINS・いえらぶ・ATBB などの物件情報シート対応 / 最大20MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            {/* LOADING STEP */}
            {step === 'loading' && (
              <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-800">PDF解析中...</p>
                  <p className="text-sm text-gray-500 mt-1">AIが物件情報を抽出しています。少々お待ちください。</p>
                </div>
                <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C1121F] rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {/* FORM STEP */}
            {step === 'form' && (
              <div className="max-w-3xl">
                {(errorWarnings.length > 0 || warnWarnings.length > 0) && (
                  <div className="mb-6 space-y-2">
                    {errorWarnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><span className="font-semibold">[{w.field}]</span> {w.message}</span>
                      </div>
                    ))}
                    {warnWarnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><span className="font-semibold">[{w.field}]</span> {w.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {errorMsg && (
                  <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* 基本情報 */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">基本情報</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">種別</label>
                        <select
                          value={formData.type ?? 'rent'}
                          onChange={(e) => updateField('type', e.target.value as 'rent' | 'buy')}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent bg-white"
                        >
                          <option value="rent">賃貸</option>
                          <option value="buy">売買</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">賃料 / 価格（円）</label>
                        <input
                          type="number"
                          value={formData.price ?? ''}
                          onChange={(e) => updateField('price', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 150000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">物件名（英語）</label>
                      <input
                        type="text"
                        value={formData.title ?? ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                        placeholder="例: Shibuya Modern Apartment"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">管理費（円）</label>
                      <input
                        type="number"
                        value={formData.management_fee ?? ''}
                        onChange={(e) => updateField('management_fee', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                        placeholder="例: 10000"
                      />
                    </div>
                  </div>
                </section>

                {/* 場所 */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">場所</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">住所（英語）</label>
                      <input
                        type="text"
                        value={formData.address ?? ''}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                        placeholder="例: Tokyo, Shibuya Ward, 1-1-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">最寄り駅（英語）</label>
                        <input
                          type="text"
                          value={formData.station ?? ''}
                          onChange={(e) => updateField('station', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: Shibuya"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">徒歩（分）</label>
                        <input
                          type="number"
                          value={formData.walking_minutes ?? ''}
                          onChange={(e) => updateField('walking_minutes', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">階数</label>
                        <input
                          type="number"
                          value={formData.floor ?? ''}
                          onChange={(e) => updateField('floor', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 3"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">緯度</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude ?? ''}
                          onChange={(e) => updateField('latitude', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 35.6595"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">経度</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude ?? ''}
                          onChange={(e) => updateField('longitude', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 139.7004"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 間取り・広さ */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">間取り・広さ</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">間取り</label>
                        <input
                          type="text"
                          value={formData.layout ?? ''}
                          onChange={(e) => updateField('layout', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 1LDK"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">部屋数</label>
                        <input
                          type="number"
                          value={formData.beds ?? ''}
                          onChange={(e) => updateField('beds', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">専有面積（㎡）</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.size ?? ''}
                          onChange={(e) => updateField('size', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 45.2"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 契約条件 */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">契約条件</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">敷金（円）</label>
                        <input
                          type="number"
                          value={formData.deposit ?? ''}
                          onChange={(e) => updateField('deposit', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 300000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">礼金（円）</label>
                        <input
                          type="number"
                          value={formData.key_money ?? ''}
                          onChange={(e) => updateField('key_money', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent"
                          placeholder="例: 150000"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 設備・条件 */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">設備・条件</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {BOOL_FIELDS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            onClick={() => updateField(key, !formData[key])}
                            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                              formData[key] ? 'bg-[#C1121F]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                formData[key] ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                {/* ステータス */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">ステータス</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          onClick={() => updateField('is_featured', !formData.is_featured)}
                          className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                            formData.is_featured ? 'bg-[#C1121F]' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_featured ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-700">おすすめ（Featured）</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          onClick={() => updateField('is_new', !formData.is_new)}
                          className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                            formData.is_new ? 'bg-[#C1121F]' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_new ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-700">新着（New）</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* カテゴリー */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">カテゴリー</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {CATEGORY_FIELDS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            onClick={() => updateField(key, !formData[key])}
                            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                              formData[key] ? 'bg-[#C1121F]' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 備考 */}
                <section className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">備考</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <textarea
                      value={formData.property_information ?? ''}
                      onChange={(e) => updateField('property_information', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C1121F] focus:border-transparent resize-none"
                      placeholder="特記事項・備考など"
                    />
                  </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-3 pb-8">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-[#C1121F] hover:bg-[#A00F1A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md"
                  >
                    {saving ? '保存中...' : 'Supabaseに登録'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    やり直す
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS STEP */}
            {step === 'success' && (
              <div className="max-w-md flex flex-col items-center text-center py-20 gap-5">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">登録完了</h2>
                  <p className="text-sm text-gray-500">物件情報をSupabaseに登録しました。</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-[#C1121F] hover:bg-[#A00F1A] text-white font-semibold rounded-xl transition-colors"
                  >
                    続けて登録
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('rent')}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    物件一覧を見る
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
