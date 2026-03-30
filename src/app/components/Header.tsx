import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/app/contexts/LanguageContext';

type NavPage = 'home' | 'buy' | 'register' | 'consultation';

interface HeaderProps {
  onNavigate?: (page: NavPage) => void;
  /** 今いるページ（指定するとメニューのアクティブ表示と連動） */
  currentPage?: NavPage;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const [activeNav, setActiveNav] = useState<'Home' | 'Buy' | 'Register'>('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const activeNavName = currentPage === 'home' ? 'Home' : currentPage === 'buy' ? 'Buy' : currentPage === 'register' ? 'Register' : activeNav;

  const handleNavClick = (e: React.MouseEvent, itemName: string, href: string) => {
    e.preventDefault();
    setActiveNav(itemName as 'Home' | 'Buy' | 'Register');

    if (itemName === 'Buy' && onNavigate) {
      onNavigate('buy');
    } else if (itemName === 'Register' && onNavigate) {
      onNavigate('register');
    } else if (itemName === 'Home' && onNavigate) {
      onNavigate('home');
    } else if (href.startsWith('#') && href.length > 1) {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { name: 'Home', label: t('nav.home'), href: '#' },
    { name: 'Buy', label: t('nav.buy'), href: '#properties' },
    { name: 'Register', label: t('nav.register'), href: '#register' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[101] bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-20">
            {/* タイトル - クリックでトップに戻る */}
            <button
              type="button"
              onClick={() => {
                setActiveNav('Home');
                onNavigate?.('home');
              }}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity h-full"
            >
              <span className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
                {t('app.title')}
              </span>
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
                </a>
              ))}
            </nav>

            {/* Right Section */}
            <div className="hidden lg:flex items-center gap-3" />

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
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

      {/* Mobile Menu（一覧の sticky z-40 より手前に出す + 背面タップで閉じる） */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              key="mobile-menu-backdrop"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed top-14 left-0 right-0 bottom-0 z-[99] bg-black/40 lg:hidden"
              aria-label="メニューを閉じる"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              key="mobile-menu-panel"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="fixed top-14 left-0 right-0 z-[100] max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto bg-white border-b border-gray-100 shadow-lg lg:hidden"
            >
              <div className="px-6 py-6 space-y-1">
                <div className="bg-gray-100 rounded-2xl p-2 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={(e) => {
                        handleNavClick(e, item.name, item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full text-left px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        flex items-center justify-between cursor-pointer
                        ${
                          activeNavName === item.name
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-200/50'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}