import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Heart, Shield, Landmark, Globe, CheckCircle2, FileText, Compass, Sparkles, ExternalLink } from 'lucide-react';

interface Article {
  title: string;
  text: string;
}

interface ArticleCategory {
  id: string;
  icon: React.ReactNode;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  title: string;
  articles: Article[];
}

interface LanguageCharter {
  code: string;
  langName: string;
  flag: string;
  mainTitle: string;
  description: string;
  categories: ArticleCategory[];
}

const charterTranslations: LanguageCharter[] = [
  {
    code: 'en',
    langName: 'English',
    flag: '🇺🇸',
    mainTitle: 'CHARTER OF RIGHTS OF THE CITIZEN OF THE NEW WORLD STATE',
    description: 'This document translates the ethical and spiritual principles of our World State into concrete protections for every human being.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. Inviolable Human and Civil Rights',
        articles: [
          {
            title: 'Universal Dignity and Equality',
            text: 'Every citizen has equal social dignity and is equal before the law, without distinction of sex, race, language, religion, political opinions, or personal and social conditions.'
          },
          {
            title: 'Personal Liberty',
            text: 'Personal liberty and domicile are inviolable.'
          },
          {
            title: 'Freedom of Thought and Religion',
            text: 'Everyone has the right to freely profess their faith, express their thoughts, and access truthful information.'
          },
          {
            title: 'Right to a Fair Trial',
            text: 'Defense is an inviolable right, and the presumption of innocence is guaranteed.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. Social and Economic Rights',
        articles: [
          {
            title: 'Right to Work',
            text: 'Work is recognized as a tool for self-realization, happiness, and social progress.'
          },
          {
            title: 'Health Protection',
            text: 'Health is a fundamental right of the individual and a collective interest.'
          },
          {
            title: 'Education and Science',
            text: 'Art, science, and teaching are free. Education is open and accessible to all.'
          },
          {
            title: 'Social Assistance',
            text: 'The State guarantees adequate protections in case of disability, illness, or need.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. Ethical and Planetary Rights',
        articles: [
          {
            title: 'Right to Peace',
            text: 'The NWS repudiates war as an instrument of offense and promotes peace as a pillar of global coexistence.'
          },
          {
            title: 'Environmental Protection',
            text: 'Every citizen has the duty to protect the landscape, flora, and fauna, ensuring sustainability for future generations.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. Political Rights and Participation',
        articles: [
          {
            title: 'Direct Democracy',
            text: 'All citizens have the right to vote and to participate actively in the life of the State, proposing laws and voting via digital direct democracy tools.'
          }
        ]
      }
    ]
  },
  {
    code: 'it',
    langName: 'Italiano',
    flag: '🇮🇹',
    mainTitle: 'CARTA DEI DIRITTI DEL CITTADINO DEL NEW WORLD STATE',
    description: 'Questo documento traduce i principi etici e spirituali del nostro Stato Mondiale in tutele concrete per ogni essere umano.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. Diritti Umani e Civili Inviolabili',
        articles: [
          {
            title: 'Dignità ed Eguaglianza Universale',
            text: 'Ogni cittadino ha pari dignità sociale ed è eguale davanti alla legge, senza distinzione di sesso, razza, lingua, religione, opinioni politiche o condizioni personali e sociali.'
          },
          {
            title: 'Libertà Personale',
            text: 'La libertà personale e il domicilio sono inviolabili.'
          },
          {
            title: 'Libertà di Pensiero e Religione',
            text: 'Tutti hanno il diritto di professare liberamente la propria fede, manifestare il proprio pensiero e accedere a un\'informazione vera.'
          },
          {
            title: 'Diritto al Giusto Processo',
            text: 'La difesa è un diritto inviolabile e vige la presunzione di non colpevolezza.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. Diritti Sociali ed Economici',
        articles: [
          {
            title: 'Diritto al Lavoro',
            text: 'Il lavoro è riconosciuto come strumento di autorealizzazione, felicità e progresso della società.'
          },
          {
            title: 'Tutela della Salute',
            text: 'La salute è un diritto fondamentale dell\'individuo e interesse della collettività.'
          },
          {
            title: 'Istruzione e Scienza',
            text: 'L\'arte, la scienza e l\'insegnamento sono liberi. L\'istruzione è aperta e accessibile a tutti.'
          },
          {
            title: 'Assistenza Sociale',
            text: 'Lo Stato garantisce tutele adeguate in caso di inabilità, malattia o necessità.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. Diritti Etici e Planetari',
        articles: [
          {
            title: 'Diritto alla Pace',
            text: 'Il NWS ripudia la guerra come strumento di offesa e promuove la pace come pilastro della convivenza mondiale.'
          },
          {
            title: 'Tutela dell\'Ambiente',
            text: 'Ogni cittadino ha il dovere di tutelare il paesaggio, la flora e la fauna, garantendo la sostenibilità per le generazioni future.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. Diritti Politici e di Partecipazione',
        articles: [
          {
            title: 'Democrazia Diretta',
            text: 'Tutti i cittadini hanno diritto di voto e di partecipare attivamente alla vita dello Stato, proponendo leggi e votando tramite strumenti di democrazia diretta e digitale.'
          }
        ]
      }
    ]
  },
  {
    code: 'fr',
    langName: 'Français',
    flag: '🇫🇷',
    mainTitle: 'CHARTE DES DROITS DU CITOYEN DU NEW WORLD STATE',
    description: 'Ce document traduit les principes éthiques et spirituels de notre État mondial en protections concrètes pour chaque être humain.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. Droits Humains et Civils Inviolables',
        articles: [
          {
            title: 'Dignité et Égalité Universelle',
            text: 'Chaque citoyen a une dignité sociale égale devant la loi, sans distinction de sexe, race, langue, religion, opinion politique ou condition personnelle et sociale.'
          },
          {
            title: 'Liberté Personnelle',
            text: 'La liberté personnelle et le domicile sont inviolables.'
          },
          {
            title: 'Liberté de Pensée et de Religion',
            text: 'Chacun a le droit de professer librement sa foi, d\'exprimer ses pensées et d\'accéder à une information véridique.'
          },
          {
            title: 'Droit à un Procès Équitable',
            text: 'La défense est un droit inviolable et la présomption d\'innocence est garantie.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. Droits Sociaux et Économiques',
        articles: [
          {
            title: 'Droit au Travail',
            text: 'Le travail est reconnu comme un outil d\'autoréalisation, de bonheur et de progrès social.'
          },
          {
            title: 'Protection de la Santé',
            text: 'La santé est un droit fondamental de l\'individu et un intérêt collectif.'
          },
          {
            title: 'Éducation et Science',
            text: 'L\'art, la science et l\'enseignement sont libres. L\'éducation est ouverte et accessible à tous.'
          },
          {
            title: 'Assistance Sociale',
            text: 'L\'État garantit des protections adéquates en cas d\'invalidité, de maladie ou de besoin.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. Droits Éthiques et Planétaires',
        articles: [
          {
            title: 'Droit à la Paix',
            text: 'Le NWS répudie la guerre comme instrument d\'agression et promeut la paix comme pilier de la coexistence mondiale.'
          },
          {
            title: 'Protection de l\'Environnement',
            text: 'Chaque citoyen a le devoir de protéger le paysage, la flore et la faune, assurant la durabilité pour les générations futures.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. Droits Politiques et Participation',
        articles: [
          {
            title: 'Démocratie Directe',
            text: 'Tous les citoyens ont le droit de voter et de participer activement à la vie de l\'État via des outils de démocratie directe numérique.'
          }
        ]
      }
    ]
  },
  {
    code: 'bn',
    langName: 'Bengali',
    flag: '🇧🇩',
    mainTitle: 'নিউ ওয়ার্ল্ড স্টেট নাগরিক অধিকার সনদ',
    description: 'এই দলিলটি আমাদের বিশ্ব রাষ্ট্রের নৈতিক ও আধ্যাত্মিক নীতিগুলিকে মানব সত্তার জন্য সুনির্দিষ্ট সুরক্ষায় রূপান্তর করে।',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. অলঙ্ঘনীয় মানবাধিকার এবং নাগরিক অধিকার',
        articles: [
          {
            title: 'সর্বজনীন মর্যাদা এবং সমতা',
            text: 'লিঙ্গ, জাতি, ভাষা, ধর্ম, রাজনৈতিক মতামত বা ব্যক্তিগত এবং সামাজিক অবস্থা নির্বিশেষে আইনের চোখে প্রতিটি নাগরিকের সমান সামাজিক মর্যাদা এবং সমতা রয়েছে।'
          },
          {
            title: 'ব্যক্তিগত স্বাধীনতা',
            text: 'ব্যক্তিগত স্বাধীনতা এবং আবাসস্থল অলঙ্ঘনীয়।'
          },
          {
            title: 'চিন্তা ও ধর্মের স্বাধীনতা',
            text: 'প্রত্যেকের নিজ নিজ ধর্ম অবাধে পালন করার, নিজস্ব চিন্তা প্রকাশের এবং সত্য তথ্য পাওয়ার অধিকার রয়েছে।'
          },
          {
            title: 'ন্যায্য বিচারের অধিকার',
            text: 'আত্মপক্ষ সমর্থনের অধিকার একটি অলঙ্ঘনীয় অধিকার এবং নির্দোষিতার অনুমান নিশ্চিত করা হয়।'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. সামাজিক ও অর্থনৈতিক অধিকার',
        articles: [
          {
            title: 'কাজের অধিকার',
            text: 'কাজকে আত্ম-উপলদ্ধি, সুখ এবং সামাজিক অগ্রগতির হাতিয়ার হিসেবে স্বীকৃতি দেওয়া হয়।'
          },
          {
            title: 'স্বাস্থ্য সুরক্ষা',
            text: 'স্বাস্থ্য ব্যক্তির একটি মৌলিক অধিকার এবং সমষ্টিগত স্বার্থ।'
          },
          {
            title: 'শিক্ষা ও বিজ্ঞান',
            text: 'শিল্প, বিজ্ঞান এবং শিক্ষণ মুক্ত। শিক্ষা সবার জন্য উন্মুক্ত এবং প্রবেশযোগ্য।'
          },
          {
            title: 'সামাজিক সহায়তা',
            text: 'অক্ষমতা, অসুস্থতা বা প্রয়োজনের ক্ষেত্রে রাষ্ট্র পর্যাপ্ত সুরক্ষা নিশ্চিত করে।'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. নৈতিক ও গ্রহগত অধিকার',
        articles: [
          {
            title: 'শান্তির অধিকার',
            text: 'NWS যুদ্ধের মতো আক্রমণাত্মক কর্মকাণ্ডকে প্রত্যাখ্যান করে এবং বিশ্বব্যাপী সহাবস্থানের স্তম্ভ হিসেবে শান্তিকে উন্নীত করে।'
          },
          {
            title: 'পরিবেশ রক্ষা',
            text: 'প্রতিটি নাগরিকের প্রাকৃতিক দৃশ্য, উদ্ভিদ এবং প্রাণীজগৎ রক্ষার দায়িত্ব রয়েছে, যা ভবিষ্যৎ প্রজন্মের জন্য স্থায়িত্ব নিশ্চিত করে।'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. রাজনৈতিক অধিকার ও অংশগ্রহণ',
        articles: [
          {
            title: 'প্রত্যক্ষ গণতন্ত্র',
            text: 'সকল নাগরিকের ভোট দেওয়ার এবং ডিজিটাল সরাসরি গণতন্ত্রের সরঞ্জামের মাধ্যমে রাষ্ট্রের কর্মকাণ্ডে সক্রিয়ভাবে অংশগ্রহণের অধিকার রয়েছে।'
          }
        ]
      }
    ]
  },
  {
    code: 'pt',
    langName: 'Português',
    flag: '🇵🇹',
    mainTitle: 'CARTA DOS DIREITOS DO CIDADÃO DO NEW WORLD STATE',
    description: 'Este documento traduz os princípios éticos e espirituais do nosso Estado Mundial em salvaguardas concretas para cada ser humano.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. Direitos Humanos e Civis Invioláveis',
        articles: [
          {
            title: 'Dignidade e Igualdade Universal',
            text: 'Cada cidadão tem igual dignidade social e é igual perante a lei, sem distinção de sexo, raça, língua, religião, opiniões políticas ou condições pessoais e sociais.'
          },
          {
            title: 'Liberdade Pessoal',
            text: 'A liberdade pessoal e o domicílio são invioláveis.'
          },
          {
            title: 'Liberdade de Pensamento e Religião',
            text: 'Todos têm o direito de professar livremente a sua fé, manifestar os seus pensamentos e aceder a informações verdadeiras.'
          },
          {
            title: 'Direito a um Julgamento Justo',
            text: 'A defesa é um direito inviolável e a presunção de inocência é garantida.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. Direitos Sociais e Económicos',
        articles: [
          {
            title: 'Direito ao Trabalho',
            text: 'O trabalho é reconhecido como uma ferramenta de autorrealização, felicidade e progresso da sociedade.'
          },
          {
            title: 'Proteção da Saúde',
            text: 'A saúde é um direito fundamental do indivíduo e um interesse coletivo.'
          },
          {
            title: 'Educação e Ciência',
            text: 'A arte, a ciência e o ensino são livres. A educação é aberta e acessível a todos.'
          },
          {
            title: 'Assistência Social',
            text: 'O Estado garante proteções adequadas em caso de invalidez, doença ou necessidade.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. Direitos Éticos e Planetários',
        articles: [
          {
            title: 'Direito à Paz',
            text: 'O NWS repudia a guerra como instrumento de ofensa e promove a paz como pilar da convivência mundial.'
          },
          {
            title: 'Proteção Ambiental',
            text: 'Todo cidadão tem o dever de proteger a paisagem, a flora e a fauna, garantindo a sustentabilidade para as gerações futuras.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. Direitos Políticos e de Participação',
        articles: [
          {
            title: 'Democracia Direta',
            text: 'Todos os cidadãos têm direito de voto e de participar ativamente na vida do Estado, propondo leis e votando através de ferramentas digitais de democracia direta.'
          }
        ]
      }
    ]
  },
  {
    code: 'ru',
    langName: 'Русский',
    flag: '🇷🇺',
    mainTitle: 'ХАРТИЯ ПРАВ ГРАЖДАН СУВЕРЕННОГО МИРОВОГО ГОСУДАРСТВА',
    description: 'Этот документ переводит этические и духовные принципы нашего Всемирного Государства в конкретные гарантии защиты каждого человеческого существа.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. Неотъемлемые права человека и гражданские права',
        articles: [
          {
            title: 'Всеобщее достоинство и равенство',
            text: 'Каждый гражданин обладает равным социальным достоинством и равен перед законом без различия пола, расы, языка, религии, политических взглядов или личного и социального положения.'
          },
          {
            title: 'Личная свобода',
            text: 'Личная свобода и неприкосновенность жилища являются незыблемыми.'
          },
          {
            title: 'Свобода мысли и религии',
            text: 'Каждый имеет право свободно исповедовать свою веру, вырашать свои мысли и получать правдивую информацию.'
          },
          {
            title: 'Право на справедливое судебное разбирательство',
            text: 'Защита является неотъемлемым правом, и презумпция невиновности гарантируется.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. Социальные и экономические права',
        articles: [
          {
            title: 'Право на труд',
            text: 'Труд признается инструментом самореализации, счастья и социального прогресса.'
          },
          {
            title: 'Охрана здоровья',
            text: 'Здоровье является фундаментальным правом человека и коллективным интересом.'
          },
          {
            title: 'Образование и наука',
            text: 'Искусство, наука и преподавание свободны. Образование открыто и доступно для всех.'
          },
          {
            title: 'Социальная помощь',
            text: 'Государство гарантирует надлежащую защиту в случае инвалидности, болезни или нужды.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. Этические и планетарные права',
        articles: [
          {
            title: 'Право на мир',
            text: 'NWS отвергает войну как инструмент агрессии и продвигает мир как столп глобального сосуществования.'
          },
          {
            title: 'Охрана окружающей среды',
            text: 'Каждый гражданин обязан беречь ландшафт, флору и фауну, обеспечивая устойчивость для будущих поколений.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. Политические права и участие',
        articles: [
          {
            title: 'Прямая демократия',
            text: 'Все граждане имеют право голосовать и активно участвовать в жизни государства, предлагая законы и голосуя с помощью инструментов цифровой прямой демократии.'
          }
        ]
      }
    ]
  },
  {
    code: 'es',
    langName: 'Español',
    flag: '🇪🇸',
    mainTitle: 'CARTA DE DERECHOS DEL CIUDADANO DEL NEW WORLD STATE',
    description: 'Este documento traduce los principios éticos y espirituales de nuestro Estado Mundial en amparos concretos para cada ser humano.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. Derechos Humanos y Civiles Inviolables',
        articles: [
          {
            title: 'Dignidad e Igualdad Universal',
            text: 'Cada ciudadano tiene igual dignidad social ante la ley, sin distinción de sexo, raza, lengua, religión, opiniones políticas o condiciones personales y sociales.'
          },
          {
            title: 'Libertad Personal',
            text: 'La libertad personal y el domicilio son inviolables.'
          },
          {
            title: 'Libertad de Pensamiento y Religión',
            text: 'Todos tienen derecho a profesar libremente su fe, manifestar su pensamiento y acceder a información veraz.'
          },
          {
            title: 'Derecho al Debido Proceso',
            text: 'La defensa es un derecho inviolable y se garantiza la presunción de inocencia.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. Derechos Sociales y Económicos',
        articles: [
          {
            title: 'Derecho al Trabajo',
            text: 'El trabajo es reconocido como herramienta de autorrealización, felicidad y progreso de la sociedad.'
          },
          {
            title: 'Protección de la Salud',
            text: 'La salud es un derecho fundamental del individuo y un interés colectivo.'
          },
          {
            title: 'Educación y Ciencia',
            text: 'El arte, la ciencia y la enseñanza son libres. La educación es abierta y accesible para todos.'
          },
          {
            title: 'Asistencia Social',
            text: 'El Estado garantiza protecciones adecuadas en caso de invalidez, enfermedad o necesidad.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. Derechos Éticos y Planetarios',
        articles: [
          {
            title: 'Derecho a la Paz',
            text: 'El NWS repudia la guerra como instrumento de ofensa y promueve la paz como pilar de la convivencia mundial.'
          },
          {
            title: 'Protección Ambiental',
            text: 'Todo ciudadano tiene el deber de proteger el paisaje, la flora y la fauna, garantizando la sostenibilidad para las generaciones futuras.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. Derechos Políticos y Participación',
        articles: [
          {
            title: 'Democracia Directa',
            text: 'Todos los ciudadanos tienen derecho al voto y a participar activamente en la vida del Estado, proponiendo leyes y votando mediante herramientas de democracia directa digital.'
          }
        ]
      }
    ]
  },
  {
    code: 'hi',
    langName: 'Hindi',
    flag: '🇮🇳',
    mainTitle: 'न्यू वर्ल्ड स्टेट के नागरिक के अधिकारों का चार्टर',
    description: 'यह दस्तावेज़ हमारे विश्व राज्य के नैतिक और आध्यात्मिक सिद्धांतों को प्रत्येक मानव के लिए ठोस सुरक्षा उपायों में अनुवादित करता है।',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. अहिन्य मानवाधिकार और नागरिक अधिकार',
        articles: [
          {
            title: 'सार्वभौमिक गरिमा और समानता',
            text: 'प्रत्येक नागरिक की समान सामाजिक गरिमा है और वह कानून के समक्ष समान है, लिंग, जाति, भाषा, धर्म, राजनीतिक राय या व्यक्तिगत और सामाजिक स्थितियों का कोई भेदभाव नहीं है।'
          },
          {
            title: 'व्यक्तिगत स्वतंत्रता',
            text: 'व्यक्तिगत स्वतंत्रता और आवास का अधिकार अहिन्य है।'
          },
          {
            title: 'विचार और धर्म की स्वतंत्रता',
            text: 'सभी को अपनी आस्था का पालन करने, अपने विचार व्यक्त करने और सत्य जानकारी तक पहुँचने का अधिकार है।'
          },
          {
            title: 'निष्पक्ष सुनवाई का अधिकार',
            text: 'बचाव एक अहिन्य अधिकार है और निर्दोषता का अनुमान सुनिश्चित है।'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. सामाजिक और आर्थिक अधिकार',
        articles: [
          {
            title: 'काम का अधिकार',
            text: 'काम को आत्म-बोध, खुशी और समाज की प्रगति का साधन माना जाता है।'
          },
          {
            title: 'स्वास्थ्य संरक्षण',
            text: 'स्वास्थ्य व्यक्ति का एक मौलिक अधिकार और सामूहिक हित है।'
          },
          {
            title: 'शिक्षा और विज्ञान',
            text: 'कला, विज्ञान और शिक्षण स्वतंत्र हैं। शिक्षा सभी के लिए खुली और सुलभ है।'
          },
          {
            title: 'सामाजिक सहायता',
            text: 'राज्य विकलांगता, बीमारी या आवश्यकता के मामले में पर्याप्त सुरक्षा सुनिश्चित करता है।'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. नैतिक और ग्रह-संबंधी अधिकार',
        articles: [
          {
            title: 'शांति का अधिकार',
            text: 'NWS युद्ध को आक्रामक साधन के रूप में अस्वीकार करता है और वैश्विक सह-अस्तित्व के स्तंभ के रूप में शांति को बढ़ावा देता है।'
          },
          {
            title: 'पर्यावरण संरक्षण',
            text: 'प्रत्येक नागरिक का कर्तव्य है कि वह परिदृश्य, वनस्पति और जीव-जंतुओं की रक्षा करे, जो भविष्य की पीढ़ियों के लिए स्थिरता सुनिश्चित करता है।'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. राजनीतिक अधिकार और भागीदारी',
        articles: [
          {
            title: 'प्रत्यक्ष लोकतंत्र',
            text: 'सभी नागरिकों को वोट देने और डिजिटल प्रत्यक्ष लोकतंत्र उपकरणों के माध्यम से राज्य के जीवन में सक्रिय रूप से भाग लेने का अधिकार है।'
          }
        ]
      }
    ]
  },
  {
    code: 'zh',
    langName: '中文',
    flag: '🇨🇳',
    mainTitle: '新世界国家公民权利宪章',
    description: '本文件将我们世界国家的伦理与精神原则转化为针对每个人的具体保障与利护。',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. 普遍人权与公民权利',
        articles: [
          {
            title: '尊严与平等',
            text: '每个公民在法律面前享有平等的社会尊严，不受性别、种族、语言、宗教、政治观点或个人及社会状况的影响。'
          },
          {
            title: '人身自由',
            text: '人身自由与住所不可侵犯。'
          },
          {
            title: '思想与信仰自由',
            text: '每个人都有权自由信仰宗教、表达思想并获取真实信息。'
          },
          {
            title: '正当程序权',
            text: '辩护权不可侵犯，并保证无罪推定。'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. 社会与经济权利',
        articles: [
          {
            title: '劳动权',
            text: '劳动被视为自我实现、幸福和社会进步的工具。'
          },
          {
            title: '健康保护',
            text: '健康是个人的基本权利和集体利益。'
          },
          {
            title: '教育与科学',
            text: '艺术、科学和教学是自由的，教育对所有人开放。'
          },
          {
            title: '社会救助',
            text: '国家保证在残疾、疾病或贫困情况下提供适当的保护。'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. 伦理与地球权利',
        articles: [
          {
            title: '和平权',
            text: 'NWS 拒绝战争作为进攻工具，促进和平作为全球共处的支柱。'
          },
          {
            title: '环境保护',
            text: '每个公民都有义务保护景观、动植物，确保子孙后代的可持续性。'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. 政治权利与参与',
        articles: [
          {
            title: '直接民主',
            text: '所有公民都有权投票并通过数字直接民主工具积极参与国家生活。'
          }
        ]
      }
    ]
  },
  {
    code: 'ar',
    langName: 'العربية',
    flag: '🌍',
    mainTitle: 'ميثاق حقوق المواطن في الدولة العالمية الجديدة',
    description: 'تترجم هذه الوثيقة المبادئ الأخلاقية والروحية لدولتنا العالمية إلى ضمانات وحمايات ملموسة لكل إنسان.',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. حقوق الإنسان والحقوق المدنية غير القابلة للتصرف',
        articles: [
          {
            title: 'الكرامة والمساواة العالمية',
            text: 'يتمتع كل مواطن بكرامة اجتماعية متساوية أمام القانون، دون تمييز في الجنس أو العرق أو اللغة أو الدين أو الرأي السياسي أو الظروف الشخصية والاجتماعية.'
          },
          {
            title: 'الحرية الشخصية',
            text: 'الحرية الشخصية والمسكن مصونان ولا يجوز انتهاكهما.'
          },
          {
            title: 'حرية الفكر والدين',
            text: 'لكل فرد الحق في ممارسة شعائره الدينية بحرية، والتعبير عن آرائه، والوصول إلى معلومات صادقة.'
          },
          {
            title: 'الحق في محاكمة عادلة',
            text: 'الدفاع حق أصيل ومصون، وقرينة البراءة مكفولة للجميع.'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. الحقوق الاجتماعية والاقتصادية',
        articles: [
          {
            title: 'الحق في العمل',
            text: 'العمل أداة لتحقيق الذات والسعادة والتقدم الاجتماعي.'
          },
          {
            title: 'حماية الصحة',
            text: 'الصحة حق أساسي للفرد ومصلحة جماعية.'
          },
          {
            title: 'التعليم والعلوم',
            text: 'الفنون والعلوم والتعليم حرة، والتعليم متاح للجميع.'
          },
          {
            title: 'المساعدة الاجتماعية',
            text: 'تضمن الدولة توفير الحماية الكافية في حالات الإعاقة أو المرض أو العوز.'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. الحقوق الأخلاقية والكونية',
        articles: [
          {
            title: 'الحق في السلام',
            text: 'يرفض NWS الحرب كأداة للعدوان ويعزز السلام كركيزة للتعايش العالمي.'
          },
          {
            title: 'حماية البيئة',
            text: 'لكل مواطن واجب حماية المناظر الطبيعية والنباتات والحيوانات، لضمان الاستدامة للأجيال القادمة.'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. الحقوق السياسية والمشاركة',
        articles: [
          {
            title: 'الديموقراطية المباشرة',
            text: 'لجميع المواطنين الحق في التصويت والمشاركة الفعالة في حياة الدولة من خلال أدوات الديموقراطية المباشرة الرقمية.'
          }
        ]
      }
    ]
  },
  {
    code: 'ja',
    langName: '日本語',
    flag: '🇯🇵',
    mainTitle: '新世界国家市民の権利憲章',
    description: 'この文書は、世界市民国家の倫理的および精神的な原則を、すべての人間に対する具体的な保護へと翻訳するものです。',
    categories: [
      {
        id: 'civil',
        icon: <Shield className="w-5 h-5" />,
        colorClass: 'text-blue-600',
        bgLightClass: 'bg-blue-50/70',
        borderClass: 'border-blue-100',
        title: 'I. 不可侵の人権と市民権',
        articles: [
          {
            title: '普遍的尊厳と平等',
            text: 'すべての市民は、等しく社会的尊厳を有し、法の下に平等です。性別、人種、言語、宗教、政治的意見、あるいは個人的・社会的条件による差別は一切ありません。'
          },
          {
            title: '個人の自由と住居の不可侵',
            text: '個人の自由および住居は不可侵です。'
          },
          {
            title: '思想と信教の自由',
            text: 'すべての人は、自らの信仰を自由に表明し、思想を表現し、真実の情報にアクセスする権利を有します。'
          },
          {
            title: '公正な裁判を受ける権利',
            text: '弁護は不可侵の権利であり、無罪の推定が保証されます。'
          }
        ]
      },
      {
        id: 'social',
        icon: <Heart className="w-5 h-5" />,
        colorClass: 'text-amber-600',
        bgLightClass: 'bg-amber-50/70',
        borderClass: 'border-amber-100',
        title: 'II. 社会的および経済的権利',
        articles: [
          {
            title: '労働の権利',
            text: '労働は、自己実現、幸福、および社会的進歩のための手段として認められます。'
          },
          {
            title: '健康の保護',
            text: '健康は個人の基本的人権であり、共同体全体の利益です。'
          },
          {
            title: '教育と科学',
            text: '芸術、科学、および教育は自由です。教育はすべての人に開かれ、アクセス可能でなければなりません。'
          },
          {
            title: '社会扶助',
            text: '国家は、障害、病気、または困窮の場合に、適切な保護を保証します。'
          }
        ]
      },
      {
        id: 'ethical',
        icon: <Compass className="w-5 h-5" />,
        colorClass: 'text-emerald-600',
        bgLightClass: 'bg-emerald-50/70',
        borderClass: 'border-emerald-100',
        title: 'III. 倫理的および地球規模の権利',
        articles: [
          {
            title: '平和への権利',
            text: '新世界国家（NWS）は、侵略の手段としての戦争を否認し、地球上の共存の柱として平和を促進します。'
          },
          {
            title: '環境保護',
            text: 'すべての市民は、将来の世代のために持続可能性を確保するため、景観、植物、動物を守る義務を負います。'
          }
        ]
      },
      {
        id: 'political',
        icon: <Landmark className="w-5 h-5" />,
        colorClass: 'text-purple-600',
        bgLightClass: 'bg-purple-50/70',
        borderClass: 'border-purple-100',
        title: 'IV. 政治的権利と参加',
        articles: [
          {
            title: '直接民主主義',
            text: 'すべての市民は、デジタル直接民主主義のツールを通じて、国家運営に投票し、積極的に活動に参加する権利を有します。'
          }
        ]
      }
    ]
  }
];

export default function CharterPage() {
  const { language } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return charterTranslations.some(c => c.code === language) ? language : 'it';
  });

  useEffect(() => {
    if (charterTranslations.some(c => c.code === language)) {
      setSelectedLanguage(language);
    }
  }, [language]);

  const currentCharter = charterTranslations.find(c => c.code === selectedLanguage) || charterTranslations[1];
  const isEn = language === 'en';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-1"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute right-0 bottom-0 opacity-[0.02] transform translate-x-24 translate-y-24 pointer-events-none">
          <Scale className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {isEn ? 'Charter of Rights' : 'Carta dei Diritti'}
          </h2>
          <p className="text-xs uppercase tracking-[0.3em] font-tech text-brand-gold font-bold">
            {isEn ? 'Universal Citizen Protection' : 'Tutela Universale del Cittadino'}
          </p>
          <div className="h-0.5 w-16 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Dynamic Multi-Language Selector Wheel/Row */}
        <div className="mb-10 text-center">
          <p className="text-[10px] uppercase font-tech font-bold text-muted tracking-wider mb-3">
            {isEn ? 'Select translation' : 'Seleziona traduzione'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto p-2 bg-brand-blue/5 rounded-2xl border border-brand-blue/5">
            {charterTranslations.map((translation) => {
              const isActive = selectedLanguage === translation.code;
              return (
                <button
                  key={translation.code}
                  onClick={() => setSelectedLanguage(translation.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-brand-blue text-white shadow-md scale-105' 
                      : 'bg-white hover:bg-brand-parchment text-brand-blue border border-brand-blue/10'
                  }`}
                >
                  <span className="text-base" role="img" aria-label={translation.langName}>
                    {translation.flag}
                  </span>
                  <span>{translation.langName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Frame / Preamble */}
        <div className="relative border-2 border-brand-gold/15 bg-[#FDFCF9] rounded-3xl p-6 md:p-10 shadow-lg mb-12 max-w-5xl mx-auto">
          {/* Internal corner borders to replicate refined official document casing */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-brand-gold/40 rounded-tl" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-brand-gold/40 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-brand-gold/40 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-brand-gold/40 rounded-br" />

          {/* Heading */}
          <div className="text-center space-y-4 mb-10">
            <span className="text-[10px] font-tech font-semibold tracking-widest text-brand-gold/90 uppercase">
              {isEn ? 'Official Decree' : 'Decreto Ufficiale'}
            </span>
            <h3 className="text-xl md:text-2xl font-serif text-[#0A1C3E] font-bold px-4 leading-tight">
              {currentCharter.mainTitle}
            </h3>
            <p className="text-xs md:text-sm text-brand-blue/70 max-w-2xl mx-auto italic font-light px-4 leading-relaxed">
              &ldquo;{currentCharter.description}&rdquo;
            </p>
          </div>

          {/* Bento Rights Structure */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedLanguage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {currentCharter.categories.map((category) => (
                  <div
                    key={category.id}
                    className={`rounded-2xl border ${category.borderClass} ${category.bgLightClass} p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white shadow-sm ${category.colorClass}`}>
                        {category.icon}
                      </div>
                      <h4 className="font-serif font-bold text-base text-brand-blue">
                        {category.title}
                      </h4>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      {category.articles.map((art, idx) => (
                        <div key={idx} className="space-y-1 group">
                          <h5 className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5 font-tech">
                            <CheckCircle2 className="w-3 h-3 text-brand-gold shrink-0" />
                            {art.title}
                          </h5>
                          <p className="text-xs text-brand-blue/90 leading-relaxed font-sans pl-4 border-l border-brand-gold/20 group-hover:border-brand-gold/50 transition-colors">
                            {art.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Institutional Resource Link Button */}
        <div className="max-w-md mx-auto text-center space-y-3">
          <p className="text-[10px] uppercase font-tech font-bold tracking-widest text-muted">
            {isEn ? 'For institutional insights' : 'Per approfondimenti istituzionali'}
          </p>
          <a
            href="https://www.newworldstate.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-brand-gold text-white hover:text-brand-blue font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>newworldstate.cloud</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Official Footer Signature */}
        <div className="mt-12 p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 text-center text-[11px] text-brand-blue/70">
          {isEn ? (
            <span>All contents are certified and compiled dynamically under NWS supreme decree guidelines. Registered citizens can claim certificates securely.</span>
          ) : (
            <span>Tutti i contenuti sono certificati e compilati dinamicamente secondo le linee guida del decreto supremo NWS. I cittadini registrati possono richiedere i certificati in modo sicuro.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
