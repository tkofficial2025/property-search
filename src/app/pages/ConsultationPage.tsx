import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Mail, MessageSquare, Phone, User, Building2, ChevronDown, Search, Video } from 'lucide-react';
import { Header } from '@/app/components/Header';
import { sendRequestEmails } from '@/lib/send-request-emails';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface ConsultationPageProps {
  onNavigate?: (page: 'home' | 'buy' | 'rent' | 'consultation') => void;
}

type Interest = 'rent' | 'buy';

const COUNTRY_CODES: { code: string; label: string; dial: string }[] = [
  { code: 'JP', label: 'Japan', dial: '+81' },
  { code: 'US', label: 'United States', dial: '+1' },
  { code: 'GB', label: 'United Kingdom', dial: '+44' },
  { code: 'AU', label: 'Australia', dial: '+61' },
  { code: 'CN', label: 'China', dial: '+86' },
  { code: 'KR', label: 'South Korea', dial: '+82' },
  { code: 'SG', label: 'Singapore', dial: '+65' },
  { code: 'HK', label: 'Hong Kong', dial: '+852' },
  { code: 'TW', label: 'Taiwan', dial: '+886' },
  { code: 'DE', label: 'Germany', dial: '+49' },
  { code: 'FR', label: 'France', dial: '+33' },
  { code: 'CA', label: 'Canada', dial: '+1' },
  { code: 'IN', label: 'India', dial: '+91' },
  { code: 'MY', label: 'Malaysia', dial: '+60' },
  { code: 'TH', label: 'Thailand', dial: '+66' },
  { code: 'PH', label: 'Philippines', dial: '+63' },
  { code: 'VN', label: 'Vietnam', dial: '+84' },
  { code: 'ID', label: 'Indonesia', dial: '+62' },
  { code: 'IT', label: 'Italy', dial: '+39' },
  { code: 'ES', label: 'Spain', dial: '+34' },
  { code: 'NL', label: 'Netherlands', dial: '+31' },
  { code: 'RU', label: 'Russia', dial: '+7' },
  { code: 'BR', label: 'Brazil', dial: '+55' },
  { code: 'OTHER', label: 'Other', dial: '+' },
];

const OTHER_DIAL = '+';

export function ConsultationPage({ onNavigate }: ConsultationPageProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+81');
  const [phoneCountryCustom, setPhoneCountryCustom] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [phoneCountrySearch, setPhoneCountrySearch] = useState('');
  const phoneCountryRef = useRef<HTMLDivElement>(null);
  const [interest, setInterest] = useState<Interest>('rent');
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferOnlineMeeting, setPreferOnlineMeeting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isOther = phoneCountry === OTHER_DIAL;
  const displayDial = isOther ? (phoneCountryCustom || OTHER_DIAL) : phoneCountry;
  const selectedCountry = COUNTRY_CODES.find((c) => c.dial === phoneCountry);

  const filteredCountries = phoneCountrySearch.trim()
    ? COUNTRY_CODES.filter(
        (c) =>
          c.code === 'OTHER' ||
          c.label.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
          c.dial.toLowerCase().includes(phoneCountrySearch.toLowerCase())
      )
    : COUNTRY_CODES;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (phoneCountryRef.current && !phoneCountryRef.current.contains(e.target as Node)) {
        setPhoneCountryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = [displayDial, phone].filter(Boolean).join(' ').trim();
    setSubmitted(true);
    sendRequestEmails({
      type: 'consultation',
      name: name.trim(),
      email: email.trim(),
      phone: fullPhone || undefined,
      interest,
      preferredDate: preferredDate || undefined,
      preferOnlineMeeting,
      message: message.trim() || undefined,
    }).then((r) => { if (!r.ok) console.error('[send-request-emails]', r.error); });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} currentPage="consultation" />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('consult.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('consult.desc')}
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-[#C1121F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[#C1121F]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('consult.thank_you')}</h2>
              <p className="text-gray-600 mb-6">
                {t('consult.success_desc')}
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.('home')}
                className="px-6 py-3 bg-[#C1121F] text-white font-semibold rounded-xl hover:bg-[#A00F1A] transition-colors"
              >
                {t('consult.back_home')}
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-10 space-y-6"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('consult.name')}
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#C1121F]/20 focus-within:border-[#C1121F]">
                  <span className="flex-shrink-0 pl-4 text-gray-400" aria-hidden>
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 min-w-0 py-3 pr-4 border-0 focus:ring-0 focus:outline-none bg-transparent"
                    placeholder={t('consult.name_ph')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('consult.email')}
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#C1121F]/20 focus-within:border-[#C1121F]">
                  <span className="flex-shrink-0 pl-4 text-gray-400" aria-hidden>
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 min-w-0 py-3 pr-4 border-0 focus:ring-0 focus:outline-none bg-transparent"
                    placeholder={t('consult.email_ph')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('consult.phone')}
                </label>
                <div className="flex items-center gap-0 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-[#C1121F]/20 focus-within:border-[#C1121F] overflow-visible">
                  <span className="flex-shrink-0 pl-4 text-gray-400 rounded-l-xl" aria-hidden>
                    <Phone className="w-5 h-5" />
                  </span>
                  <div className="relative flex-shrink-0 border-r border-gray-200 bg-gray-50" ref={phoneCountryRef}>
                    <button
                      type="button"
                      onClick={() => setPhoneCountryOpen((o) => !o)}
                      className="flex items-center gap-1.5 py-3 pl-3 pr-2 min-w-[140px] text-left text-gray-700 focus:outline-none"
                      aria-expanded={phoneCountryOpen}
                      aria-haspopup="listbox"
                    >
                      {isOther ? (
                        <input
                          type="text"
                          value={phoneCountryCustom}
                          onChange={(e) => setPhoneCountryCustom(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="+XX"
                          className="w-16 py-0.5 px-1.5 border border-gray-200 rounded bg-white text-sm focus:ring-1 focus:ring-[#C1121F]/30 focus:border-[#C1121F] focus:outline-none"
                        />
                      ) : (
                        <span className="truncate text-sm">
                          {selectedCountry ? `${selectedCountry.dial} ${selectedCountry.label}` : phoneCountry}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${phoneCountryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {phoneCountryOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-80"
                          role="listbox"
                        >
                          <div className="flex-shrink-0 p-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <input
                                type="text"
                                value={phoneCountrySearch}
                                onChange={(e) => setPhoneCountrySearch(e.target.value)}
                                placeholder={t('consult.search_country')}
                                className="flex-1 min-w-0 py-1 bg-transparent border-0 text-sm focus:ring-0 focus:outline-none"
                              />
                            </div>
                          </div>
                          <ul className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1 overscroll-contain">
                            {filteredCountries.map(({ code, label, dial }) => (
                              <li key={code}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={phoneCountry === dial}
                                  onClick={() => {
                                    setPhoneCountry(dial);
                                    setPhoneCountryOpen(false);
                                    setPhoneCountrySearch('');
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${phoneCountry === dial ? 'bg-[#C1121F]/5 text-[#C1121F] font-medium' : 'text-gray-700'}`}
                                >
                                  {code === 'OTHER' ? `Other (enter code)` : `${dial} ${label}`}
                                </button>
                              </li>
                            ))}
                            {filteredCountries.length === 0 && (
                              <li className="px-4 py-3 text-sm text-gray-500">No matches</li>
                            )}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 min-w-0 py-3 px-4 border-0 focus:ring-0 focus:outline-none bg-transparent rounded-r-xl"
                    placeholder="90 1234 5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  I'm interested in *
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#C1121F]/20 focus-within:border-[#C1121F]">
                  <span className="flex-shrink-0 pl-4 text-gray-400" aria-hidden>
                    <Building2 className="w-5 h-5" />
                  </span>
                  <select
                    required
                    value={interest}
                    onChange={(e) => setInterest(e.target.value as Interest)}
                    className="flex-1 min-w-0 py-3 pr-10 pl-0 border-0 focus:ring-0 focus:outline-none bg-transparent appearance-none"
                  >
                    <option value="rent">Renting a property</option>
                    <option value="buy">Buying a property</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preferred consultation date
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#C1121F]/20 focus-within:border-[#C1121F]">
                  <span className="flex-shrink-0 pl-4 text-gray-400" aria-hidden>
                    <Calendar className="w-5 h-5" />
                  </span>
                  <input
                    id="preferredDate"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="flex-1 min-w-0 py-3 pr-4 border-0 focus:ring-0 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Meeting preference
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer" onClick={() => setPreferOnlineMeeting(!preferOnlineMeeting)}>
                  <div className="flex-shrink-0">
                    <Video className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="preferOnlineMeeting"
                      checked={preferOnlineMeeting}
                      onChange={(e) => setPreferOnlineMeeting(e.target.checked)}
                      className="w-5 h-5 text-[#C1121F] border-gray-300 rounded focus:ring-[#C1121F] focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="preferOnlineMeeting" className="text-gray-700 cursor-pointer flex-1">
                      {t('consult.online')}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('consult.message')}
                </label>
                <div className="flex gap-3 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#C1121F]/20 focus-within:border-[#C1121F]">
                  <span className="flex-shrink-0 pt-4 pl-4 text-gray-400 self-start" aria-hidden>
                    <MessageSquare className="w-5 h-5" />
                  </span>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 min-w-0 py-3 pr-4 border-0 focus:ring-0 focus:outline-none bg-transparent resize-none"
                    placeholder={t('consult.message_ph')}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#C1121F] text-white font-semibold rounded-xl hover:bg-[#A00F1A] transition-colors shadow-lg hover:shadow-xl"
              >
                {t('consult.submit')}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
