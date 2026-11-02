"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Eye, Map, Mountain, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useDictionary } from '../../../context/DictionaryContext';
import { useProgress } from '../../../context/ProgressContext';

type Tab = 'reglas' | 'instrucciones' | 'historia' | 'faq';

const formatColectikos = (text: string | undefined) => {
  if (!text) return null;
  const parts = text.split('COLECTIKOS');
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && <strong className="font-bold">COLECTIKOS</strong>}
    </React.Fragment>
  ));
};

const formatColectikosHtml = (htmlStr: string | undefined) => {
  if (!htmlStr) return '';
  return htmlStr.replace(/COLECTIKOS/g, '<strong>COLECTIKOS</strong>');
};

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

function AccordionItem({ title, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-4 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 focus:outline-none hover:bg-stone-50 transition-colors text-left"
      >
        <span className="font-semibold text-slate-800 pr-8">{title}</span>
        {isOpen ? (
          <ChevronUp className="text-emerald-600 flex-shrink-0" size={20} />
        ) : (
          <ChevronDown className="text-emerald-600 flex-shrink-0" size={20} />
        )}
      </button>
      
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 text-slate-600 border-t border-slate-50 mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function NuestraAppContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { setShowTour } = useProgress();
  const lang = params.lang || 'es';
  
  const tabParam = searchParams.get('tab') as Tab;
  const initialTab = tabParam && ['historia', 'reglas', 'instrucciones', 'faq'].includes(tabParam) ? tabParam : 'historia';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  
  const dict = useDictionary();
  const t = dict.nuestraApp;
  const faqT = dict.communityFaq;

  useEffect(() => {
    if (tabParam && ['historia', 'reglas', 'instrucciones', 'faq'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const scrollToSecretos = () => {
    setActiveTab('reglas');
    setTimeout(() => {
      const el = document.getElementById('secretos');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-800 pb-20 pt-24 px-4 sm:px-6">
      
      {/* HEADER / NAVIGATION */}
      <div className="max-w-5xl mx-auto mb-10 sm:mb-12 relative">
        {/* Sello de Atribución Gema Digital */}
        <div className="flex justify-center sm:justify-end mb-4 sm:mb-0 sm:absolute sm:top-1 sm:right-0 z-10">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs border border-stone-200/80 hover:border-stone-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-xs transition-all duration-300 group">
            <span className="text-[11px] sm:text-xs text-stone-500 font-medium tracking-tight">
              {t.gemaAttribution || (lang === 'en' ? 'A product proudly designed and produced by' : 'Un producto orgullosamente diseñado y producido por')}{' '}
              <span className="font-bold text-stone-800">Gema Digital</span>
            </span>
            <img 
              src="/images/Imagenes_Pagina/logo_gema_digital.png" 
              alt="Gema Digital" 
              className="h-5 sm:h-6 w-auto object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        <h1 className="text-4xl font-serif italic text-center mb-8 text-stone-900 pt-1">
          {t.title}
        </h1>
        
        {/* IN-PAGE TABS */}
        <div className="flex justify-start md:justify-center overflow-x-auto space-x-8 border-b border-stone-200 no-scrollbar">
          <button
            onClick={() => setActiveTab('historia')}
            className={`pb-3 px-2 text-lg whitespace-nowrap transition-colors duration-200 ${
              activeTab === 'historia'
                ? 'text-green-800 font-semibold border-b-2 border-green-600'
                : 'text-gray-500 hover:text-green-700'
            }`}
          >
            {t.tabHistory}
          </button>
          <button
            onClick={() => setActiveTab('reglas')}
            className={`pb-3 px-2 text-lg whitespace-nowrap transition-colors duration-200 ${
              activeTab === 'reglas'
                ? 'text-green-800 font-semibold border-b-2 border-green-600'
                : 'text-gray-500 hover:text-green-700'
            }`}
          >
            {t.tabRules}
          </button>
          <button
            onClick={() => setActiveTab('instrucciones')}
            className={`pb-3 px-2 text-lg whitespace-nowrap transition-colors duration-200 ${
              activeTab === 'instrucciones'
                ? 'text-green-800 font-semibold border-b-2 border-green-600'
                : 'text-gray-500 hover:text-green-700'
            }`}
          >
            {t.tabInstructions}
          </button>
          <button
            onClick={scrollToSecretos}
            className="pb-3 px-2 text-lg whitespace-nowrap transition-colors duration-200 text-gray-500 hover:text-green-700"
          >
            {t.tabSecrets}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-2 text-lg whitespace-nowrap transition-colors duration-200 ${
              activeTab === 'faq'
                ? 'text-green-800 font-semibold border-b-2 border-green-600'
                : 'text-gray-500 hover:text-green-700'
            }`}
          >
            {faqT?.tabTitle || 'FAQ'}
          </button>
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      <div className="max-w-5xl mx-auto">
        
        {/* TAB 3: NUESTRA HISTORIA */}
        {activeTab === 'historia' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-serif italic text-center text-stone-800 mb-4">
              {formatColectikos(t.historyTitle)}
            </h2>
            <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-stone-300 to-transparent mb-8"></div>

            <div className="max-w-3xl mx-auto space-y-6 text-stone-700 leading-relaxed mb-16">
              <p>{formatColectikos(t.historyP1)}</p>
              <p>{formatColectikos(t.historyP2)}</p>
              <p>{formatColectikos(t.historyP3)}</p>
            </div>

            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-2xl font-bold text-stone-900 text-center mb-8">{t.historyStrategicDeclarations}</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                  <h4 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <Mountain className="text-emerald-600" size={24} />
                    {t.historyMissionTitle}
                  </h4>
                  <p className="text-stone-700 leading-relaxed">{t.historyMissionDesc}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                  <h4 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <Eye className="text-emerald-600" size={24} />
                    {t.historyVisionTitle}
                  </h4>
                  <p className="text-stone-700 leading-relaxed">{t.historyVisionDesc}</p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-2xl font-bold text-stone-900 text-center mb-8">{formatColectikos(t.historyCoreValuesTitle)}</h3>
              <div className="space-y-6">
                {[
                  { title: t.historyGrowthTitle, desc: t.historyGrowthDesc },
                  { title: t.historyWonderTitle, desc: t.historyWonderDesc },
                  { title: t.historyImpactTitle, desc: t.historyImpactDesc },
                  { title: t.historyCommunityTitle, desc: t.historyCommunityDesc },
                  { title: t.historyIdentityTitle, desc: t.historyIdentityDesc }
                ].map((val, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100 items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-stone-900 mb-2">{val.title}</h4>
                      <p className="text-stone-700 leading-relaxed">{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 1: REGLAS DEL JUEGO */}
        {activeTab === 'reglas' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-serif italic text-center text-stone-800 mb-4">
              {t.rulesTitle}
            </h2>
            <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-stone-300 to-transparent mb-8"></div>
            
            <p className="max-w-2xl mx-auto text-center text-stone-600 mb-12 leading-relaxed whitespace-pre-line">
              {formatColectikos(t.rulesDesc)}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Card 1: Curioso */}
              <div className="bg-white rounded-2xl shadow-sm p-8 relative text-center border border-stone-100 flex flex-col items-center z-10 hover:shadow-md transition-shadow">
                <span className="absolute top-4 right-6 text-gray-300 text-lg font-bold">1</span>
                <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                  <img src="/images/Imagenes_Pagina/Otico-modos-curoiso.png" alt="Otico Curioso" className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">{t.modeCurioso}</h3>
                <p className="text-sm text-emerald-700 font-medium mb-4 italic">
                  {t.modeCuriosoQuote}
                </p>
                <p className="text-stone-600 leading-relaxed text-sm">
                  {t.modeCuriosoDesc}
                </p>
                
                {/* Connecting Line (Desktop only) */}
                <div className="hidden md:block absolute top-1/3 -right-8 w-8 border-t-2 border-dashed border-stone-300 -z-10"></div>
              </div>

              {/* Card 2: Nómada */}
              <div className="bg-white rounded-2xl shadow-sm p-8 relative text-center border border-stone-100 flex flex-col items-center z-10 hover:shadow-md transition-shadow">
                <span className="absolute top-4 right-6 text-gray-300 text-lg font-bold">2</span>
                <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                  <img src="/images/Imagenes_Pagina/Otico-modos-nomada2.PNG" alt="Otico Nómada" className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">{t.modeNomada}</h3>
                <p className="text-sm text-amber-700 font-medium mb-4 italic">
                  {t.modeNomadaQuote}
                </p>
                <p className="text-stone-600 leading-relaxed text-sm">
                  {t.modeNomadaDesc}
                </p>

                {/* Connecting Line (Desktop only) */}
                <div className="hidden md:block absolute top-1/3 -right-8 w-8 border-t-2 border-dashed border-stone-300 -z-10"></div>
              </div>

              {/* Card 3: Conquistador */}
              <div className="bg-white rounded-2xl shadow-sm p-8 relative text-center border border-stone-100 flex flex-col items-center z-10 hover:shadow-md transition-shadow">
                <span className="absolute top-4 right-6 text-gray-300 text-lg font-bold">3</span>
                <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                  <img src="/images/Imagenes_Pagina/Otico-modos-conquitador.png" alt="Otico Conquistador" className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">{t.modeConquistador}</h3>
                <p className="text-sm text-red-700 font-medium mb-4 italic">
                  {t.modeConquistadorQuote}
                </p>
                <p className="text-stone-600 leading-relaxed text-sm">
                  {t.modeConquistadorDesc}
                </p>
              </div>

            </div>

            {/* TRUCOS Y BUENAS PRÁCTICAS */}
            <div className="mt-24 md:mt-32 max-w-5xl mx-auto text-left px-6">
              <hr className="w-24 mx-auto border-stone-300 mb-16" />
              <h2 id="secretos" className="font-serif text-3xl text-green-900 text-center mb-4 scroll-mt-28">
                {formatColectikos(t.secretsTitle)}
              </h2>
              <p className="text-gray-600 text-center mb-12 leading-relaxed">
                {t.secretsIntro}
              </p>

              <h3 className="text-green-800 font-medium text-xl mt-10 mb-3">{t.secSub1}</h3>
              <p className="text-gray-700 leading-relaxed">{formatColectikos(t.secP1)}</p>

              <h3 className="text-green-800 font-medium text-xl mt-10 mb-3">{t.secSub2}</h3>
              <p className="text-gray-700 leading-relaxed">{t.secP2}</p>

              <h3 className="text-green-800 font-medium text-xl mt-10 mb-3">{t.secSub3}</h3>
              <p className="text-gray-700 leading-relaxed">{t.secP3}</p>

              <h3 className="text-green-800 font-medium text-xl mt-10 mb-3">{t.secSub4}</h3>
              <p className="text-gray-700 leading-relaxed">{formatColectikos(t.secP4)}</p>
            </div>
          </section>
        )}

        {/* TAB 2: INSTRUCCIONES */}
        {activeTab === 'instrucciones' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-serif italic text-center text-stone-800 mb-4">
              {t.instTitle}
            </h2>
            <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-stone-300 to-transparent mb-12"></div>
            
            <div className="max-w-3xl mx-auto space-y-10 text-left bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-stone-100">
              
              <div>
                <h3 className="text-2xl font-serif italic text-emerald-900 mb-3">{formatColectikos(t.instH1)}</h3>
                <p className="text-stone-700 leading-relaxed mb-4">
                  {formatColectikos(t.instP1)}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTour(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors rounded-full font-medium text-sm shadow-sm"
                >
                  <PlayCircle size={18} />
                  {t.replayTourBtn || 'Repetir Tour de Bienvenida'}
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl space-y-4">
                <h3 className="text-xl font-serif font-medium text-emerald-900">{t.instH2_8}</h3>
                <p className="text-stone-700 leading-relaxed">
                  {formatColectikos(t.instP2_8)}
                </p>
                <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                  <li dangerouslySetInnerHTML={{ __html: t.instLi8_1 }}></li>
                  <li dangerouslySetInnerHTML={{ __html: t.instLi8_2 }}></li>
                </ul>
              </div>

              <AccordionItem title={t.instH2_1}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {t.instP2_1}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi1_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi1_2 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi1_3 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi1_4 }}></li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={t.instH2_2}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {formatColectikos(t.instP2_2)}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi2_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi2_2 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi2_3 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi2_4 }}></li>
                    {t.instLi2_5 && <li dangerouslySetInnerHTML={{ __html: t.instLi2_5 }}></li>}
                    {t.instLi2_6 && <li dangerouslySetInnerHTML={{ __html: t.instLi2_6 }}></li>}
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={t.instH2_3}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {t.instP2_3}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi3_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi3_2 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi3_3 }}></li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={t.instH2_4}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {t.instP2_4}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi4_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi4_2 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi4_3 }}></li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={t.instH2_5}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {t.instP2_5}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi5_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi5_2 }}></li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={t.instH2_6}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {formatColectikos(t.instP2_6)}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi6_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi6_2 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi6_3 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi6_4 }}></li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={t.instH2_7}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {t.instP2_7}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: t.instLi7_1 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi7_2 }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t.instLi7_3 }}></li>
                  </ul>
                </div>
              </AccordionItem>

              <AccordionItem title={dict.gamification?.rule8Title || "8. Conviértete en Leyenda (Cómo ganar XP, Rachas y Niveles)"}>
                <div className="space-y-4">
                  <p className="text-stone-700 leading-relaxed">
                    {dict.gamification?.rule8Intro}
                  </p>
                  
                  <h4 className="font-semibold text-stone-900 mt-4">{dict.gamification?.rule8StreaksTitle}</h4>
                  <p className="text-stone-700 leading-relaxed">
                    {dict.gamification?.rule8StreaksIntro}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: dict.gamification?.rule8StreaksLi1 || '' }} />
                    <li dangerouslySetInnerHTML={{ __html: formatColectikosHtml(dict.gamification?.rule8StreaksLi2) }} />
                  </ul>

                  <h4 className="font-semibold text-stone-900 mt-6">{dict.gamification?.rule8XpTitle}</h4>
                  <p className="text-stone-700 leading-relaxed">
                    {formatColectikos(dict.gamification?.rule8XpIntro)}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: dict.gamification?.rule8XpLi1 || '' }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.gamification?.rule8XpLi2 || '' }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.gamification?.rule8XpLi3 || '' }} />
                  </ul>

                  <h4 className="font-semibold text-stone-900 mt-6">{dict.gamification?.rule8LevelTitle}</h4>
                  <p className="text-stone-700 leading-relaxed">
                    {formatColectikos(dict.gamification?.rule8LevelIntro)}
                  </p>
                  <ul className="list-disc list-outside ml-6 space-y-2 text-stone-700 leading-relaxed marker:text-emerald-600">
                    <li dangerouslySetInnerHTML={{ __html: dict.gamification?.rule8LevelLi1 || '' }} />
                    <li dangerouslySetInnerHTML={{ __html: dict.gamification?.rule8LevelLi2 || '' }} />
                    <li dangerouslySetInnerHTML={{ __html: formatColectikosHtml(dict.gamification?.rule8LevelLi3) }} />
                  </ul>
                </div>
              </AccordionItem>

            </div>
          </section>
        )}

        {/* TAB 4: FAQ */}
        {activeTab === 'faq' && faqT && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-serif italic text-center text-stone-800 mb-8">
              {faqT.tabTitle}
            </h2>

            {/* Categoria 1 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                {faqT.cat1Title}
              </h3>
              <AccordionItem title={faqT.q1_1}>{faqT.a1_1}</AccordionItem>
              <AccordionItem title={faqT.q1_2}>{faqT.a1_2}</AccordionItem>
            </div>

            {/* Categoria 2 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                {faqT.cat2Title}
              </h3>
              <AccordionItem title={faqT.q2_1}>{faqT.a2_1}</AccordionItem>
              <AccordionItem title={faqT.q2_2}>{faqT.a2_2}</AccordionItem>
            </div>

            {/* Categoria 3 */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                {faqT.cat3Title}
              </h3>
              <AccordionItem title={faqT.q3_1}>{faqT.a3_1}</AccordionItem>
              <AccordionItem title={faqT.q3_2}>{faqT.a3_2}</AccordionItem>
              <AccordionItem title={faqT.q3_3}>{faqT.a3_3}</AccordionItem>
            </div>
            
          </section>
        )}

      </div>

      {/* FOOTER LEGAL */}
      <footer className="mt-16 pb-8 text-center">
        <span className="text-xs text-stone-500">
          {t.footerText1}
        </span>
        <Link 
          href={`/${lang}/terminos`} 
          className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
        >
          {t.footerLink}
        </Link>
      </footer>
    </div>
  );
}

export default function NuestraAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EE]"></div>}>
      <NuestraAppContent />
    </Suspense>
  );
}
