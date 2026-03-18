import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Menu, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

type NavPage = 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog' | 'about' | 'account' | 'favorites';

interface HeaderProps {
  onNavigate?: (page: NavPage) => void;
  /** 今いるページ（指定するとメニューのアクティブ表示と連動） */
  currentPage?: NavPage;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const [activeNav, setActiveNav] = useState<'Home' | 'Buy' | 'Rent' | 'Blog' | 'About'>('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const { currency, setCurrency, rateDate } = useCurrency();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) setLanguageOpen(false);
    }
    if (currencyOpen || languageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [currencyOpen, languageOpen]);

  const activeNavName = currentPage === 'home' ? 'Home' : currentPage === 'buy' ? 'Buy' : currentPage === 'rent' ? 'Rent' : currentPage === 'consultation' ? 'Consultation' : currentPage === 'category' ? 'Rent' : currentPage === 'blog' ? 'Blog' : currentPage === 'about' ? 'About' : activeNav;

  const handleNavClick = (e: React.MouseEvent, itemName: string, href: string) => {
    e.preventDefault();
    setActiveNav(itemName as 'Home' | 'Buy' | 'Rent' | 'Blog' | 'About');

    if (itemName === 'Buy' && onNavigate) {
      onNavigate('buy');
    } else if (itemName === 'Rent' && onNavigate) {
      onNavigate('rent');
    } else if (itemName === 'Home' && onNavigate) {
      onNavigate('home');
    } else if (itemName === 'Blog' && onNavigate) {
      onNavigate('blog');
    } else if (itemName === 'About' && onNavigate) {
      onNavigate('about');
    } else if (href.startsWith('#') && href.length > 1) {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { name: 'Home', label: t('nav.home'), href: '#' },
    { name: 'Buy', label: t('nav.buy'), href: '#properties' },
    { name: 'Rent', label: t('nav.rent'), href: '#properties' },
    { name: 'Blog', label: t('nav.blog'), href: '#' },
    { name: 'About', label: t('nav.about'), href: '#why-us', hasDropdown: true },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-20">
            {/* Logo - クリックでトップに戻る */}
            <button
              type="button"
              onClick={() => {
                setActiveNav('Home');
                onNavigate?.('home');
              }}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity h-full"
            >
              <img src="/logo4.png" alt="Tokyo Expat Housing" className="h-10 md:h-14 w-auto object-contain mix-blend-multiply" />
            </button>

            {/* Desktop Navigation - Pill Container */}
            <nav className="hidden lg:flex items-center bg-gray-100 rounded-full px-2 py-1.5">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.name, item.href)}
                  className={`
                    relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    flex items-center gap-1 cursor-pointer
                    ${
                      activeNavName === item.name
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/50'
                    }
                  `}
                >
                  {item.label}
                  {item.hasDropdown && (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  )}
                </a>
              ))}
            </nav>

            {/* Right Section - Utilities & CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative" ref={languageRef}>
                <button
                  type="button"
                  onClick={() => setLanguageOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {language === 'en' ? 'EN' : '中文'}
                  <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${languageOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {languageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 py-1 min-w-[100px] bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    >
                      <button
                        type="button"
                        onClick={() => { setLanguage('en'); setLanguageOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${language === 'en' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLanguage('zh'); setLanguageOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${language === 'zh' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        中文
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Currency Selector */}
              <div className="relative" ref={currencyRef}>
                <button
                  type="button"
                  onClick={() => setCurrencyOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {currency === 'JPY' ? '¥' : 
                   currency === 'USD' ? '$' : 
                   currency === 'CNY' ? '¥' : 
                   currency === 'KRW' ? '₩' : 
                   currency === 'AUD' ? 'A$' : 
                   currency === 'CAD' ? 'C$' : '$'}
                  <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 py-1 min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    >
                      <button
                        type="button"
                        onClick={() => { setCurrency('JPY'); setCurrencyOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${currency === 'JPY' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        ¥ JPY
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCurrency('USD'); setCurrencyOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${currency === 'USD' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        $ USD
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCurrency('CNY'); setCurrencyOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${currency === 'CNY' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        ¥ CNY
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCurrency('KRW'); setCurrencyOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${currency === 'KRW' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        ₩ KRW
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCurrency('AUD'); setCurrencyOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${currency === 'AUD' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        A$ AUD
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCurrency('CAD'); setCurrencyOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm font-medium ${currency === 'CAD' ? 'bg-gray-100 text-[#C1121F]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        C$ CAD
                      </button>
                      {rateDate && (
                        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                          Rate: {rateDate}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* Free Consultation CTA */}
              <button
                type="button"
                onClick={() => onNavigate?.('consultation')}
                className="px-5 py-2 text-sm font-semibold text-[#C1121F] border-2 border-[#C1121F] rounded-full hover:bg-[#C1121F] hover:text-white transition-all duration-200"
              >
                {t('nav.consultation')}
              </button>

              {/* ログイン中: ハート（お気に入り）＋人（アカウント）。未ログイン: My account */}
              {user && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('favorites')}
                  className="flex items-center justify-center p-2 text-gray-700 border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  aria-label="Favorites"
                >
                  <Heart className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate?.(user ? 'account' : 'account')}
                className={`flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 ${user ? 'p-2' : 'px-4 py-2'}`}
                aria-label={user ? t('nav.account') : t('nav.signin')}
              >
                <User className="w-4 h-4 flex-shrink-0" />
                {!user && <span>{t('nav.signin')}</span>}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-100 lg:hidden overflow-hidden"
          >
            <div className="px-6 py-6 space-y-1">
              {/* Mobile Navigation */}
              <div className="bg-gray-100 rounded-2xl p-2 space-y-1 mb-6">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      handleNavClick(e, item.name, item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      block px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      flex items-center justify-between cursor-pointer
                      ${
                        activeNavName === item.name
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-200/50'
                      }
                    `}
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <ChevronDown className="w-4 h-4 opacity-70" />
                    )}
                  </a>
                ))}
              </div>

              {/* Mobile Utilities - 言語・通貨 */}
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${language === 'en' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('zh')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${language === 'zh' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    中文
                  </button>
                </div>
                <div className="flex-1 flex gap-1 flex-wrap min-w-0">
                  <button
                    type="button"
                    onClick={() => setCurrency('JPY')}
                    className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium rounded-xl ${currency === 'JPY' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    ¥
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium rounded-xl ${currency === 'USD' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('CNY')}
                    className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium rounded-xl ${currency === 'CNY' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    ¥
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('KRW')}
                    className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium rounded-xl ${currency === 'KRW' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    ₩
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('AUD')}
                    className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium rounded-xl ${currency === 'AUD' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    A$
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('CAD')}
                    className={`flex-1 min-w-[60px] flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium rounded-xl ${currency === 'CAD' ? 'bg-[#C1121F] text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    C$
                  </button>
                </div>
              </div>

              {/* Mobile CTAs */}
              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('consultation');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-5 py-3 text-sm font-semibold text-[#C1121F] border-2 border-[#C1121F] rounded-xl hover:bg-[#C1121F] hover:text-white transition-all duration-200"
                >
                  Free Consultation
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.('favorites');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl"
                    aria-label="Favorites"
                  >
                    <Heart className="w-4 h-4" />
                    Favorites
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('account');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl"
                  aria-label="My account"
                >
                  <User className="w-4 h-4" />
                  My account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}