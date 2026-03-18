import { motion, AnimatePresence } from 'motion/react';
import { X, Menu } from 'lucide-react';
import { useState } from 'react';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2 text-gray-900 hover:text-[#C1121F] transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 md:hidden shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <span className="text-xl font-semibold text-gray-900">Menu</span>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-6 h-6 text-gray-900" />
                  </button>
                </div>
                <nav className="flex-1 p-6">
                  <ul className="space-y-4">
                    <li>
                      <a
                        href="#services"
                        className="block text-lg text-gray-700 hover:text-[#C1121F] transition-colors py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Services
                      </a>
                    </li>
                    <li>
                      <a
                        href="#why-us"
                        className="block text-lg text-gray-700 hover:text-[#C1121F] transition-colors py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Why Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#properties"
                        className="block text-lg text-gray-700 hover:text-[#C1121F] transition-colors py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Properties
                      </a>
                    </li>
                  </ul>
                </nav>
                <div className="p-6 border-t border-gray-100">
                  <button className="w-full px-6 py-3 bg-[#C1121F] text-white rounded-lg hover:bg-[#A00F1A] transition-colors">
                    Contact Us
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
