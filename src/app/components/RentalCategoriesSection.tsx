import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Heart, 
  Sofa, 
  Building, 
  DollarSign, 
  GraduationCap, 
  Home, 
  Baby 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

const CATEGORIES: Omit<Category, 'count'>[] = [
  { 
    id: 'luxury', 
    name: 'Luxury', 
    icon: <img src="https://img.icons8.com/?size=100&id=100235&format=png&color=000000" alt="Luxury" className="w-6 h-6" />
  },
  { 
    id: 'pet-friendly', 
    name: 'Pet friendly', 
    icon: <Heart className="w-6 h-6" />
  },
  { 
    id: 'furnished', 
    name: 'Furnished', 
    icon: <Sofa className="w-6 h-6" />
  },
  { 
    id: 'top-floor', 
    name: 'High-Rise Residence', 
    icon: <Building className="w-6 h-6" />
  },
  { 
    id: 'no-key-money', 
    name: 'No key money', 
    icon: <DollarSign className="w-6 h-6" />
  },
  { 
    id: 'for-students', 
    name: 'For students', 
    icon: <GraduationCap className="w-6 h-6" />
  },
  { 
    id: 'designers', 
    name: 'Designers', 
    icon: <Home className="w-6 h-6" />
  },
  { 
    id: 'for-families', 
    name: 'For families', 
    icon: <Baby className="w-6 h-6" />
  },
];

export interface RentalCategoriesSectionProps {
  onCategoryClick?: (categoryId: string) => void;
}

const CATEGORY_I18N_KEYS: Record<string, string> = {
  'luxury': 'category.luxury',
  'pet-friendly': 'category.pet_friendly',
  'furnished': 'category.furnished',
  'top-floor': 'category.high_rise',
  'no-key-money': 'category.no_key_money',
  'for-students': 'category.students',
  'designers': 'category.designers',
  'for-families': 'category.families',
};

export function RentalCategoriesSection({ onCategoryClick }: RentalCategoriesSectionProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>(() =>
    CATEGORIES.map((c) => ({ ...c, count: 0 }))
  );

  useEffect(() => {
    async function fetchCounts() {
      const { data, error } = await supabase.from('properties').select('*').eq('type', 'rent');
      if (error || !data?.length) {
        setCategories((prev) => prev.map((c) => ({ ...c, count: 0 })));
        return;
      }

      const counts: Record<string, number> = {};
      
      // 各カテゴリーのカウント
      for (const property of data) {
        const prop = property as any;
        
        // Luxury: is_featuredがtrue
        if (prop.is_featured) {
          counts['luxury'] = (counts['luxury'] || 0) + 1;
        }
        
        // Pet friendly
        if (prop.pet_friendly === true) {
          counts['pet-friendly'] = (counts['pet-friendly'] || 0) + 1;
        }
        
        // Furnished: タイトルに"furnished"が含まれる
        const titleLower = (prop.title || '').toLowerCase();
        if (titleLower.includes('furnished') || titleLower.includes('家具付き')) {
          counts['furnished'] = (counts['furnished'] || 0) + 1;
        }
        
        // Top floor: floorが高い（5階以上）
        if (prop.floor && prop.floor >= 5) {
          counts['top-floor'] = (counts['top-floor'] || 0) + 1;
        }
        
        // No key money: key_moneyが0またはnull
        if (!prop.key_money || prop.key_money === 0) {
          counts['no-key-money'] = (counts['no-key-money'] || 0) + 1;
        }
        
        // For students: タイトルに"student"が含まれる
        if (titleLower.includes('student') || titleLower.includes('学生')) {
          counts['for-students'] = (counts['for-students'] || 0) + 1;
        }
        
        // Designers: タイトルに"design"が含まれる
        if (titleLower.includes('design') || titleLower.includes('デザイナー')) {
          counts['designers'] = (counts['designers'] || 0) + 1;
        }
        
        // For families: タイトルに"family"が含まれる、またはbeds >= 2
        if (titleLower.includes('family') || titleLower.includes('家族') || (prop.beds && prop.beds >= 2)) {
          counts['for-families'] = (counts['for-families'] || 0) + 1;
        }
      }

      setCategories(
        CATEGORIES.map((c) => ({ ...c, count: counts[c.id] || 0 }))
      );
    }
    fetchCounts();
  }, []);

  return (
    <section className="py-12 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mb-6 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t('section.categories.title')}
          </h2>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCategoryClick?.(category.id);
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 group-hover:bg-[#C1121F] transition-colors ${category.id === 'luxury' ? 'group-hover:bg-gray-100' : 'group-hover:text-white'}`}>
                  {category.id === 'luxury' ? (
                    <img 
                      src="https://img.icons8.com/?size=100&id=100235&format=png&color=000000" 
                      alt="Luxury" 
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    category.icon
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                    {CATEGORY_I18N_KEYS[category.id] ? t(CATEGORY_I18N_KEYS[category.id]) : category.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {t('section.categories.properties_count').replace('{n}', String(category.count))}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
