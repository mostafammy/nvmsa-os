export type Locale = 'en' | 'ar';

export type OrganGroup = 'eb' | 'sc' | 'sd';

export interface OfficialSeat {
  no: number;
  organ: OrganGroup;
  organLabel: string;
  code: string;
  title: string;
  name: string | null;
  vacantLabel?: string;
  email: string;
  whatsapp?: string;
  whatsappHref?: string;
  unitTag?: string;
}

export interface SampleCoordinator {
  name: string;
  role: string;
  unit: string;
  focus: string;
}

export interface ImpactKpi {
  value: string;
  label: string;
  detail: string;
}

export interface CommitteeMetricRow {
  code: string;
  name: string;
  activities: number;
  onlineReach: number;
  onlineDisplay: string;
  offlineReach: number;
  sessions: number;
  trainers: number;
  participants: number;
}

export interface SupportDivisionMetric {
  code: string;
  sessions: number;
  trainers: number;
}

export interface CommitteeUnit {
  id: string;
  group: 'sc' | 'sd';
  code: string;
  name: string;
  officerCode: string;
  officerName: string | null;
  officerEmail: string;
  summary: string;
  highlights: string[];
  statLine: string;
}

export interface CampaignItem {
  id: string;
  tag: string;
  title: string;
  summary: string;
  metric: string;
  partners: string;
}

export interface PastOfficial {
  position: string;
  name: string;
  email: string;
}

export interface TermArchive {
  id: string;
  label: string;
  status: 'verified' | 'placeholder';
  themeTitle: string;
  presidentName: string;
  presidentQuote: string;
  executiveSummary: string[];
  highlights: string[];
  officials: PastOfficial[];
  metricsLine: string;
}

export interface PartnerItem {
  name: string;
  kind: string;
  scope: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LandingLocaleContent {
  lang: Locale;
  dir: 'ltr' | 'rtl';
  alternatePath: string;
  alternateLabel: string;
  meta: {
    title: string;
    description: string;
  };
  skipToContent: string;
  nav: {
    brandName: string;
    brandSub: string;
    links: { href: string; label: string }[];
    osLabel: string;
    menuOpenLabel: string;
    menuCloseLabel: string;
  };
  hero: {
    locationLine: string;
    headlineLines: string[];
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    osCta: string;
    facts: { value: string; label: string }[];
    photoAlt: string;
  };
  about: {
    heading: string;
    intro: string;
    paragraphs: string[];
    pillars: { title: string; body: string }[];
    oasisPhotoAlt: string;
    colonnadePhotoAlt: string;
  };
  team: {
    heading: string;
    intro: string;
    termBadge: string;
    filters: { id: 'all' | OrganGroup; label: string; count: number }[];
    ebHeading: string;
    scHeading: string;
    sdHeading: string;
    columns: {
      code: string;
      role: string;
      official: string;
      contact: string;
    };
    copyEmailLabel: string;
    whatsappLabel: string;
    emailLabel: string;
    sampleToggleClosed: string;
    sampleToggleOpen: string;
    sampleNotice: string;
    sampleCoordinators: SampleCoordinator[];
  };
  impact: {
    heading: string;
    intro: string;
    kpis: ImpactKpi[];
    lensHeading: string;
    lenses: {
      id: 'online' | 'activities' | 'sessions' | 'participants';
      label: string;
      unit: string;
    }[];
    committees: CommitteeMetricRow[];
    sdHeading: string;
    sdUnitLabel: string;
    sdRows: SupportDivisionMetric[];
    sdgHeading: string;
    sdgs: string[];
  };
  committees: {
    heading: string;
    intro: string;
    scGroupLabel: string;
    sdGroupLabel: string;
    officerLabel: string;
    highlightsLabel: string;
    units: CommitteeUnit[];
  };
  campaigns: {
    heading: string;
    intro: string;
    items: CampaignItem[];
  };
  history: {
    heading: string;
    intro: string;
    presidentLabel: string;
    summaryLabel: string;
    rosterLabel: string;
    placeholderBadge: string;
    terms: TermArchive[];
  };
  joinPartners: {
    joinHeading: string;
    joinIntro: string;
    joinSteps: { title: string; body: string }[];
    followLabel: string;
    partnerHeading: string;
    partnerIntro: string;
    partners: PartnerItem[];
    sponsorNote: string;
    sponsorEmailCta: string;
    sponsorWhatsappCta: string;
    oasisColumnsAlt: string;
  };
  faq: {
    heading: string;
    intro: string;
    items: FaqItem[];
  };
  contact: {
    heading: string;
    intro: string;
    ebDirectHeading: string;
    socialHeading: string;
    socialNote: string;
    socialLinks: { label: string; handle: string; href: string }[];
  };
  footer: {
    placeLine: string;
    osPrompt: string;
    osLinkLabel: string;
    photoCredit: string;
    copyright: string;
  };
  toastCopied: string;
  officials: OfficialSeat[];
}

const SOCIAL_LINKS_EN = [
  {
    label: 'NVU Medicine Official Hub',
    handle: 'linktr.ee/facultyofmedcinenvu',
    href: 'https://linktr.ee/facultyofmedcinenvu',
  },
  {
    label: 'Facebook',
    handle: "New Valley Medical Students' Association-NVMSA",
    href: 'https://www.facebook.com/search/top?q=New%20Valley%20Medical%20Students%27%20Association-NVMSA',
  },
  {
    label: 'Instagram',
    handle: '@nvmsa.newvalley',
    href: 'https://www.instagram.com/',
  },
];

const SOCIAL_LINKS_AR = [
  {
    label: 'بوابة روابط كلية الطب',
    handle: 'linktr.ee/facultyofmedcinenvu',
    href: 'https://linktr.ee/facultyofmedcinenvu',
  },
  {
    label: 'فيسبوك',
    handle: "New Valley Medical Students' Association-NVMSA",
    href: 'https://www.facebook.com/search/top?q=New%20Valley%20Medical%20Students%27%20Association-NVMSA',
  },
  {
    label: 'إنستغرام',
    handle: '@nvmsa.newvalley',
    href: 'https://www.instagram.com/',
  },
];

const OFFICIALS_EN: OfficialSeat[] = [
  {
    no: 1,
    organ: 'eb',
    organLabel: 'Executive Board',
    code: 'PRES',
    title: 'President',
    name: 'Abeer Harby',
    email: 'president.nvmsa@gmail.com',
    whatsapp: '+20 103 214 0238',
    whatsappHref: 'https://wa.me/201032140238',
  },
  {
    no: 2,
    organ: 'eb',
    organLabel: 'Executive Board',
    code: 'VP',
    title: 'Vice President',
    name: 'Hana Mahmoud',
    email: 'vp.nvmsa@gmail.com',
  },
  {
    no: 3,
    organ: 'eb',
    organLabel: 'Executive Board',
    code: 'SecGen',
    title: 'Secretary General',
    name: 'Mostafa Yaser',
    email: 'sec.gen.nvmsa@gmail.com',
    whatsapp: '+20 111 698 8273',
    whatsappHref: 'https://wa.me/201116988273',
  },
  {
    no: 4,
    organ: 'eb',
    organLabel: 'Executive Board',
    code: 'TREAS',
    title: 'Treasurer',
    name: 'Mohamed Adel',
    email: 'treasurer.nvmsa@gmail.com',
  },
  {
    no: 5,
    organ: 'sc',
    organLabel: 'Standing Committee',
    code: 'LPO',
    unitTag: 'SCOPH',
    title: 'Local Public Health Officer',
    name: 'Omar Mohamed',
    email: 'lpoo.nvmsa@gmail.com',
    whatsapp: '+20 120 775 4657',
    whatsappHref: 'https://wa.me/201207754657',
  },
  {
    no: 6,
    organ: 'sc',
    organLabel: 'Standing Committee',
    code: 'LORP',
    unitTag: 'SCORP',
    title: 'Local Officer on Human Rights and Peace',
    name: null,
    vacantLabel: 'Nomination pending',
    email: 'lorp.nvmsa@gmail.com',
  },
  {
    no: 7,
    organ: 'sc',
    organLabel: 'Standing Committee',
    code: 'LOME',
    unitTag: 'SCOME',
    title: 'Local Officer on Medical Education',
    name: 'Zain Wael',
    email: 'lome.nvmsa@gmail.com',
  },
  {
    no: 8,
    organ: 'sc',
    organLabel: 'Standing Committee',
    code: 'LORA',
    unitTag: 'SCORA',
    title: 'Local Officer on Sexual & Reproductive Health and Rights',
    name: 'Shahd Tamer',
    email: 'lora.nvmsa@gmail.com',
  },
  {
    no: 9,
    organ: 'sc',
    organLabel: 'Standing Committee',
    code: 'LEO & LORE',
    unitTag: 'SCOPE & SCORE',
    title: 'Local Exchange Officer & Local Officer on Research Exchange',
    name: 'Ehab Mokhtar',
    email: 'leo.lore.nvmsa@gmail.com',
  },
  {
    no: 10,
    organ: 'sd',
    organLabel: 'Support Division',
    code: 'CBSDD',
    unitTag: 'CBSD',
    title: 'Capacity Building Support Division Director',
    name: 'Ahmed Sameh',
    email: 'cbsdd.nvmsa@gmail.com',
  },
  {
    no: 11,
    organ: 'sd',
    organLabel: 'Support Division',
    code: 'PSDD',
    unitTag: 'PSD',
    title: 'Project Support Division Director',
    name: 'Mohamed Omran',
    email: 'psdd.nvmsa@gmail.com',
    whatsapp: '+20 102 724 6280',
    whatsappHref: 'https://wa.me/201027246280',
  },
  {
    no: 12,
    organ: 'sd',
    organLabel: 'Support Division',
    code: 'PNSDD',
    unitTag: 'PNSD',
    title: 'Publication & New Technology Support Division Director',
    name: 'Ahmed Elfouly',
    email: 'pnsdd.nvmsa@gmail.com',
  },
  {
    no: 13,
    organ: 'sd',
    organLabel: 'Support Division',
    code: 'RSDD',
    unitTag: 'RSD',
    title: 'Research Support Division Director',
    name: 'Mohamed Mahmoud',
    email: 'rsdd.nvmsa@gmail.com',
  },
];

const OFFICIALS_AR: OfficialSeat[] = [
  {
    no: 1,
    organ: 'eb',
    organLabel: 'المكتب التنفيذي',
    code: 'PRES',
    title: 'رئيس الجمعية',
    name: 'عبير حربي',
    email: 'president.nvmsa@gmail.com',
    whatsapp: '+20 103 214 0238',
    whatsappHref: 'https://wa.me/201032140238',
  },
  {
    no: 2,
    organ: 'eb',
    organLabel: 'المكتب التنفيذي',
    code: 'VP',
    title: 'نائب الرئيس',
    name: 'هنا محمود',
    email: 'vp.nvmsa@gmail.com',
  },
  {
    no: 3,
    organ: 'eb',
    organLabel: 'المكتب التنفيذي',
    code: 'SecGen',
    title: 'الأمين العام',
    name: 'مصطفى ياسر',
    email: 'sec.gen.nvmsa@gmail.com',
    whatsapp: '+20 111 698 8273',
    whatsappHref: 'https://wa.me/201116988273',
  },
  {
    no: 4,
    organ: 'eb',
    organLabel: 'المكتب التنفيذي',
    code: 'TREAS',
    title: 'أمين الصندوق',
    name: 'محمد عادل',
    email: 'treasurer.nvmsa@gmail.com',
  },
  {
    no: 5,
    organ: 'sc',
    organLabel: 'اللجان الدائمة',
    code: 'LPO',
    unitTag: 'SCOPH',
    title: 'مسؤول الصحة العامة المحلي',
    name: 'عمر محمد',
    email: 'lpoo.nvmsa@gmail.com',
    whatsapp: '+20 120 775 4657',
    whatsappHref: 'https://wa.me/201207754657',
  },
  {
    no: 6,
    organ: 'sc',
    organLabel: 'اللجان الدائمة',
    code: 'LORP',
    unitTag: 'SCORP',
    title: 'مسؤول حقوق الإنسان والسلام المحلي',
    name: null,
    vacantLabel: 'المقعد قيد التعيين',
    email: 'lorp.nvmsa@gmail.com',
  },
  {
    no: 7,
    organ: 'sc',
    organLabel: 'اللجان الدائمة',
    code: 'LOME',
    unitTag: 'SCOME',
    title: 'مسؤول التعليم الطبي المحلي',
    name: 'زين وائل',
    email: 'lome.nvmsa@gmail.com',
  },
  {
    no: 8,
    organ: 'sc',
    organLabel: 'اللجان الدائمة',
    code: 'LORA',
    unitTag: 'SCORA',
    title: 'مسؤولة الصحة والحقوق الإنجابية المحلية',
    name: 'شهد تامر',
    email: 'lora.nvmsa@gmail.com',
  },
  {
    no: 9,
    organ: 'sc',
    organLabel: 'اللجان الدائمة',
    code: 'LEO & LORE',
    unitTag: 'SCOPE & SCORE',
    title: 'مسؤول التبادل الطلابي والتبادل البحثي المحلي',
    name: 'إيهاب مختار',
    email: 'leo.lore.nvmsa@gmail.com',
  },
  {
    no: 10,
    organ: 'sd',
    organLabel: 'أقسام الدعم',
    code: 'CBSDD',
    unitTag: 'CBSD',
    title: 'مدير قسم دعم بناء القدرات',
    name: 'أحمد سامح',
    email: 'cbsdd.nvmsa@gmail.com',
  },
  {
    no: 11,
    organ: 'sd',
    organLabel: 'أقسام الدعم',
    code: 'PSDD',
    unitTag: 'PSD',
    title: 'مدير قسم دعم المشروعات',
    name: 'محمد عمران',
    email: 'psdd.nvmsa@gmail.com',
    whatsapp: '+20 102 724 6280',
    whatsappHref: 'https://wa.me/201027246280',
  },
  {
    no: 12,
    organ: 'sd',
    organLabel: 'أقسام الدعم',
    code: 'PNSDD',
    unitTag: 'PNSD',
    title: 'مدير قسم النشر والتكنولوجيا الحديثة',
    name: 'أحمد الفولي',
    email: 'pnsdd.nvmsa@gmail.com',
  },
  {
    no: 13,
    organ: 'sd',
    organLabel: 'أقسام الدعم',
    code: 'RSDD',
    unitTag: 'RSD',
    title: 'مدير قسم دعم البحث العلمي',
    name: 'محمد محمود',
    email: 'rsdd.nvmsa@gmail.com',
  },
];

export const LANDING_CONTENT: Record<Locale, LandingLocaleContent> = {
  en: {
    lang: 'en',
    dir: 'ltr',
    alternatePath: '/ar/',
    alternateLabel: 'العربية',
    meta: {
      title: "NVMSA — New Valley Medical Students' Association",
      description:
        "New Valley Medical Students' Association (NVMSA) at New Valley University Faculty of Medicine in El Kharga Oasis: Executive Board, Standing Committees, 2025/2026 impact metrics, and partnerships.",
    },
    skipToContent: 'Skip to main content',
    nav: {
      brandName: 'NVMSA',
      brandSub: 'New Valley',
      links: [
        { href: '#about', label: 'Mission' },
        { href: '#team', label: 'Team' },
        { href: '#impact', label: 'Impact' },
        { href: '#committees', label: 'Committees' },
        { href: '#history', label: 'History' },
        { href: '#join', label: 'Join & Partner' },
        { href: '#contact', label: 'Contact' },
      ],
      osLabel: 'NVMSA OS',
      menuOpenLabel: 'Open menu',
      menuCloseLabel: 'Close menu',
    },
    hero: {
      locationLine: 'Faculty of Medicine, New Valley University — El Kharga Oasis',
      headlineLines: [
        'Medical students',
        'shaping healthcare',
        'across the New Valley.',
      ],
      lead: 'An active IFMSA-Egypt local committee uniting clinical training, oasis public health outreach, scientific research, and student leadership beneath the gateway of Hibis.',
      primaryCta: 'Explore our team',
      secondaryCta: 'View 25/26 impact',
      osCta: 'Open NVMSA OS',
      facts: [
        { value: '13', label: 'Official seats' },
        { value: '46', label: 'Committee activities (25/26)' },
        { value: '154,951+', label: 'Campaign views reached' },
        { value: '9', label: 'UN SDGs addressed' },
      ],
      photoAlt: 'Sandstone east gateway of the Temple of Hibis framed by date palms in El Kharga Oasis',
    },
    about: {
      heading: 'Grounded in El Kharga, connected across Egypt',
      intro:
        "New Valley Medical Students' Association (NVMSA) represents medical students at New Valley University, pairing hands-on medical education with community service tailored to Egypt's Western Desert.",
      paragraphs: [
        'Our emblem joins two silhouettes: the limestone gateway of Hibis Temple standing in El Kharga Oasis, and a living cardiac trace rising between its columns. Together they reflect physicians in training who stay rooted in their governorate while advancing modern clinical standards.',
        'Through IFMSA-Egypt standing committees and specialized support divisions, NVMSA equips students to run school and campus health campaigns, organize scientific conferences, practice clinical reasoning, and represent New Valley at national assemblies.',
      ],
      pillars: [
        {
          title: 'Community health in the oasis',
          body: 'Physical vital-signs checks, first-aid booths, school awareness visits, and digital campaigns reaching tens of thousands across New Valley and partner governorates.',
        },
        {
          title: 'Clinical and research capacity',
          body: 'Structured peer training in clinical reasoning, curriculum quality, research methodology, project management, and media production.',
        },
        {
          title: 'Inter-governorate collaboration',
          body: 'Joint campaigns with sister local committees from Aswan, Luxor, Minya, Assiut, Suez, Menofia, Benha, Al-Azhar, MUST, and Horus.',
        },
      ],
      oasisPhotoAlt: 'Panoramic view of Hibis Temple surrounded by El Kharga Oasis palm groves and desert escarpment',
      colonnadePhotoAlt: 'Sunlit sandstone columns with papyrus capitals inside the courtyard of Hibis Temple',
    },
    team: {
      heading: 'Current Team of Officials',
      intro:
        'Thirteen elected and appointed seats govern NVMSA across the Executive Board, Standing Committees, and Support Divisions.',
      termBadge: 'Active Term Roster',
      filters: [
        { id: 'all', label: 'All officials', count: 13 },
        { id: 'eb', label: 'Executive Board', count: 4 },
        { id: 'sc', label: 'Standing Committees', count: 5 },
        { id: 'sd', label: 'Support Divisions', count: 4 },
      ],
      ebHeading: 'Executive Board',
      scHeading: 'Standing Committee Officers',
      sdHeading: 'Support Division Directors',
      columns: {
        code: 'Code',
        role: 'Position',
        official: 'Designated Officer',
        contact: 'Direct Channels',
      },
      copyEmailLabel: 'Copy email',
      whatsappLabel: 'WhatsApp',
      emailLabel: 'Email',
      sampleToggleClosed: 'Preview local coordinators & general team (sample data)',
      sampleToggleOpen: 'Hide local coordinators preview',
      sampleNotice:
        'Sample preview entries: general coordinator rosters are updated at the start of each wave and shown here as structural stand-ins until finalized.',
      sampleCoordinators: [
        {
          name: 'Local Coordinators Pool (Sample)',
          role: 'Campaign & Logistics Coordinator',
          unit: 'SCOPH / PSD',
          focus: 'Campus vital-signs booths and logistics approvals',
        },
        {
          name: 'Buddy Group Leaders (Sample)',
          role: 'Peer Education Coordinators',
          unit: 'SCOME',
          focus: 'Clinical reasoning circles and member scoring',
        },
        {
          name: 'GBV & Advocacy Assistants (Sample)',
          role: 'Joint Campaign Coordinators',
          unit: 'SCORA × SCORP',
          focus: '16 Days of Activism and school outreach sessions',
        },
        {
          name: 'Creative & Archive Team (Sample)',
          role: 'Reels, Design & Documentation',
          unit: 'PNSD',
          focus: 'Visual identity guidelines and monthly archiving',
        },
      ],
    },
    impact: {
      heading: 'Measured impact in 2025/2026',
      intro:
        'Every figure below comes directly from the audited NVMSA 2025/2026 End-of-Term Report across online outreach, physical training, and inter-LC advocacy.',
      kpis: [
        {
          value: '154,951+',
          label: 'Verified online views',
          detail: 'Combined reach across SCOPH, SCOME, SCORP, and SCORA campaigns',
        },
        {
          value: '46',
          label: 'Standing committee activities',
          detail: 'SCORA (15), SCOME (13), SCOPH (11), SCORP (7)',
        },
        {
          value: '85%',
          label: 'Active member retention',
          detail: '85 active members retained out of 100 new members enrolled',
        },
        {
          value: '60',
          label: 'Training & CB sessions',
          detail: '43 Standing Committee + 17 Support Division sessions with 48 trainers',
        },
        {
          value: '325',
          label: 'SC training participants',
          detail: 'Plus 200 offline field beneficiaries & 50 NVMSA Iftar attendees',
        },
        {
          value: '17',
          label: 'Joint collaborations',
          detail: '14 LC-to-LC partnerships & 3 external institutional collaborations',
        },
      ],
      lensHeading: 'Compare committee output by metric',
      lenses: [
        { id: 'online', label: 'Online reach', unit: 'views' },
        { id: 'activities', label: 'Activities run', unit: 'activities' },
        { id: 'sessions', label: 'Training sessions', unit: 'sessions' },
        { id: 'participants', label: 'Workshop participants', unit: 'participants' },
      ],
      committees: [
        {
          code: 'SCOME',
          name: 'Medical Education',
          activities: 13,
          onlineReach: 60000,
          onlineDisplay: '60,000+',
          offlineReach: 100,
          sessions: 11,
          trainers: 11,
          participants: 75,
        },
        {
          code: 'SCORA',
          name: 'Sexual & Reproductive Health',
          activities: 15,
          onlineReach: 35496,
          onlineDisplay: '35,496',
          offlineReach: 50,
          sessions: 21,
          trainers: 12,
          participants: 150,
        },
        {
          code: 'SCORP',
          name: 'Human Rights & Peace',
          activities: 7,
          onlineReach: 31409,
          onlineDisplay: '31,409',
          offlineReach: 20,
          sessions: 9,
          trainers: 7,
          participants: 70,
        },
        {
          code: 'SCOPH',
          name: 'Public Health',
          activities: 11,
          onlineReach: 28046,
          onlineDisplay: '28,046',
          offlineReach: 30,
          sessions: 2,
          trainers: 2,
          participants: 30,
        },
      ],
      sdHeading: 'Support Divisions capacity building (2025/2026)',
      sdUnitLabel: 'sessions',
      sdRows: [
        { code: 'CBSD', sessions: 8, trainers: 8 },
        { code: 'PSD', sessions: 3, trainers: 3 },
        { code: 'PNSD', sessions: 3, trainers: 1 },
        { code: 'RSD', sessions: 2, trainers: 3 },
        { code: 'FSD', sessions: 1, trainers: 1 },
      ],
      sdgHeading: '9 UN Sustainable Development Goals addressed',
      sdgs: [
        'SDG 3 Good Health & Well-Being',
        'SDG 4 Quality Education',
        'SDG 5 Gender Equality',
        'SDG 6 Clean Water & Sanitation',
        'SDG 8 Decent Work & Economic Growth',
        'SDG 10 Reduced Inequalities',
        'SDG 11 Sustainable Cities & Communities',
        'SDG 13 Climate Action',
        'SDG 16 Peace, Justice & Strong Institutions',
      ],
    },
    committees: {
      heading: 'Committees & Support Divisions',
      intro:
        'Select any Standing Committee or Support Division to inspect its mandate, current officer, and verified field output.',
      scGroupLabel: 'Standing Committees',
      sdGroupLabel: 'Support Divisions',
      officerLabel: 'Current lead',
      highlightsLabel: 'Verified 2025/2026 work',
      units: [
        {
          id: 'SCOPH',
          group: 'sc',
          code: 'SCOPH',
          name: 'Standing Committee on Public Health',
          officerCode: 'LPO',
          officerName: 'Omar Mohamed',
          officerEmail: 'lpoo.nvmsa@gmail.com',
          summary:
            'Advances preventive health, non-communicable disease literacy, mental health advocacy, and Universal Health Coverage campaigns.',
          highlights: [
            'World Diabetes Day, smoking awareness video, and Alzheimer disease education',
            '6-LC UHC International Day online campaign with Aswan, Azhar Cairo, Luxor, Minya, and Nahda',
            'World Mental Health Day & Mental Health among Medical Practitioners campaigns',
          ],
          statLine: '11 activities · 28,046 online views · 30 participants',
        },
        {
          id: 'SCOME',
          group: 'sc',
          code: 'SCOME',
          name: 'Standing Committee on Medical Education',
          officerCode: 'LOME',
          officerName: 'Zain Wael',
          officerEmail: 'lome.nvmsa@gmail.com',
          summary:
            'Equips medical students with clinical skills, curriculum literacy, accreditation awareness, and structured peer buddy groups.',
          highlights: [
            'Physical Vital Signs & Time Management campaigns on campus',
            'Clinical Reasoning, Digitalization, Medicine Decoded, and Curriculum Accreditation sessions',
            'Ramadan Clinics conjoint with SCOPH and Autism/Parkinsonism music therapy campaign',
          ],
          statLine: '13 activities · 60,000+ online views · 11 CB sessions',
        },
        {
          id: 'SCORA',
          group: 'sc',
          code: 'SCORA',
          name: 'Standing Committee on Sexual & Reproductive Health and Rights',
          officerCode: 'LORA',
          officerName: 'Shahd Tamer',
          officerEmail: 'lora.nvmsa@gmail.com',
          summary:
            'Leads evidence-based maternal health, reproductive education, gender equity, and anti-GBV advocacy in safe, respectful formats.',
          highlights: [
            '"The Missing Chapter" International Day of Reproductive Health campaign across 6 Egyptian LCs',
            '16 Days of Activism against GBV & Sexual Assault Awareness Month "No More Hush" webinar with SCORP',
            'SCORA Cafe interactive debate and International Women’s Day spotlight',
          ],
          statLine: '15 activities · 35,496 online views · 150 training participants',
        },
        {
          id: 'SCORP',
          group: 'sc',
          code: 'SCORP',
          name: 'Standing Committee on Human Rights and Peace',
          officerCode: 'LORP',
          officerName: null,
          officerEmail: 'lorp.nvmsa@gmail.com',
          summary:
            'Champions health equity, anti-stigma campaigns, vulnerable population rights, and human-rights awareness in clinical settings.',
          highlights: [
            'Gender Disparity in Health collaboration with Horus (HMSA) and Assiut (ASSA)',
            'Together Against Stigma project, World Autism Day, and International Human Rights Day with SCOME',
            'Conjoint GBV & Equity sessions ("Pink and Blue Diseases") with SCORA',
          ],
          statLine: '7 activities · 31,409 online views · 70 training participants',
        },
        {
          id: 'SCOPE-SCORE',
          group: 'sc',
          code: 'SCOPE & SCORE',
          name: 'Professional & Research Exchanges',
          officerCode: 'LEO & LORE',
          officerName: 'Ehab Mokhtar',
          officerEmail: 'leo.lore.nvmsa@gmail.com',
          summary:
            'Coordinates clinical clerkship and research exchange readiness, incoming/outgoing standards, and IFMSA exchange opportunities.',
          highlights: [
            'Dedicated LEO & LORE officer seat unified for the current term',
            'Direct student guidance on IFMSA-Egypt professional and research exchange tracks',
            'Collaboration with RSD and SCOME on research & clinical preparedness',
          ],
          statLine: 'Clinical & research exchange desk',
        },
        {
          id: 'CBSD',
          group: 'sd',
          code: 'CBSD',
          name: 'Capacity Building Support Division',
          officerCode: 'CBSDD',
          officerName: 'Ahmed Sameh',
          officerEmail: 'cbsdd.nvmsa@gmail.com',
          summary:
            'Trains members and officials in leadership, teamwork, conflict management, project design, and facilitation skills.',
          highlights: [
            'Soft-skills wave: CB 101, Teamwork, Documentation, G-Suite, Decision Making & Resilience',
            'SC-SD wave: Project Management 101, Monitoring & Evaluation, Stakeholder Engagement, Elevator Pitching',
            'Delivered 8 capacity-building sessions with 8 trainers in 2025/2026',
          ],
          statLine: '8 CB sessions · 8 trainers in 25/26',
        },
        {
          id: 'PSD',
          group: 'sd',
          code: 'PSD',
          name: 'Project Support Division',
          officerCode: 'PSDD',
          officerName: 'Mohamed Omran',
          officerEmail: 'psdd.nvmsa@gmail.com',
          summary:
            'Turns student ideas into structured, approved initiatives with proposal writing, logistics, monitoring, and impact reporting.',
          highlights: [
            'Enrollment & Show-of-Interest forms, Proposal Writing, and Merchandise & Logistics workshops',
            'Project Management foundational sessions in partnership with CBSD',
            'Secured faculty approvals for Orientation Day, school campaigns, and NVUCOM 2026',
          ],
          statLine: '3 CB sessions · Faculty & partner approvals',
        },
        {
          id: 'PNSD',
          group: 'sd',
          code: 'PNSD',
          name: 'Publication & New Technology Support Division',
          officerCode: 'PNSDD',
          officerName: 'Ahmed Elfouly',
          officerEmail: 'pnsdd.nvmsa@gmail.com',
          summary:
            'Governs NVMSA visual identity, digital publications, social media analytics, and technical platforms including NVMSA OS.',
          highlights: [
            '2 regulatory publications (CI Manual, Brand Guidelines & Online Moderation)',
            'Published 8 reels, 5 campaign posts, and 2 partner visuals with 4 brand CB hours',
            'Trained members on Canva, Photoshop, video editing, and digital analytics',
          ],
          statLine: '4 brand CB hours · 2 regulatory manuals',
        },
        {
          id: 'RSD',
          group: 'sd',
          code: 'RSD',
          name: 'Research Support Division',
          officerCode: 'RSDD',
          officerName: 'Mohamed Mahmoud',
          officerEmail: 'rsdd.nvmsa@gmail.com',
          summary:
            'Cultivates scientific literacy and undergraduate medical research from hypothesis formulation through conference presentation.',
          highlights: [
            '"From Hypothesis to Evidence" online research basics campaign with MSSA-Menofia',
            'Co-organized the 1st Student Research Conference at Faculty of Medicine, NVU',
            'Baseline research needs assessment and Vital Signs physical collaboration with SCOME',
          ],
          statLine: '2 CB sessions · 1st NVU Student Research Conference',
        },
        {
          id: 'FSD',
          group: 'sd',
          code: 'FSD',
          name: 'Financial Support Division',
          officerCode: 'TREAS',
          officerName: 'Mohamed Adel',
          officerEmail: 'treasurer.nvmsa@gmail.com',
          summary:
            'Builds sustainable sponsorships, transparent budgeting, membership packages, and national IFMSA-Egypt financial representation.',
          highlights: [
            'Developed the NVMSA membership & merchandise package and sponsor prospect list',
            'Secured local sponsorship with Coffee & Book and represented NVMSA at the 1st NGA',
            'National Fundraising Team representation (Mostafa Yaser as Data Collector)',
          ],
          statLine: '2 local financial initiatives · Managed via Treasurer',
        },
      ],
    },
    campaigns: {
      heading: 'Signature events & national presence',
      intro:
        'From New Valley University medical conferences to six-governorate digital advocacy and IFMSA-Egypt national assemblies.',
      items: [
        {
          id: 'nvucom',
          tag: 'Conferences & Campus',
          title: 'NVUCOM 2026 & 1st Student Research Conference',
          summary:
            'Co-organized the 5th Medical Conference of the Faculty of Medicine (NVUCOM 2026), the 1st Student Research Conference, and the faculty’s inaugural Art Rhythm exhibition.',
          metric: '3 flagship faculty-wide events',
          partners: 'Faculty of Medicine, New Valley University',
        },
        {
          id: 'uhc',
          tag: 'Public Health · SCOPH × SCOME',
          title: 'Universal Health Coverage 6-LC Coalition',
          summary:
            'Coordinated an inter-governorate UHC International Day online campaign uniting Upper and Lower Egypt medical student chapters around equitable care.',
          metric: '6 Local Committees united',
          partners: 'AMSA-Aswan, AMSA-Azhar Cairo, LMSA-Luxor, MSSA-Minya, NMSA-Nahda',
        },
        {
          id: 'gbv',
          tag: 'Advocacy · SCORA × SCORP',
          title: 'The Missing Chapter & 16 Days of Activism',
          summary:
            'Delivered joint reproductive health, maternal health, and anti-GBV campaigns including the "No More Hush" webinar and Safe Women Unit agreement.',
          metric: '35,496+ SCORA · 31,409 SCORP views',
          partners: 'Safe Women Unit (NVU), Y-PEER, BSSS-Banha, SMSA-Suez, MSSA-Menofia, OSSS-6th October',
        },
        {
          id: 'clinical',
          tag: 'Clinical Skills · SCOME',
          title: 'Vital Signs, First Aid & Medicine Decoded',
          summary:
            'Brought physical Vital Signs and First Aid booths onto campus alongside Clinical Reasoning, Digitalization, and Curriculum Accreditation online series.',
          metric: '60,000+ online views · 100 offline reached',
          partners: 'SCOME & RSD',
        },
        {
          id: 'national',
          tag: 'National Representation',
          title: 'IFMSA-Egypt NGAs & UNFPA Advocacy Workshops',
          summary:
            'Delegated officials to the 1st and 3rd National General Assemblies, Pre-15th Winter Camp, AMET Workshop, RH Lab Phase 1, and UNFPA & Misr Foundation Advanced Advocacy.',
          metric: '6 national forums & workshops',
          partners: 'IFMSA-Egypt, UNFPA, Misr Foundation',
        },
        {
          id: 'community',
          tag: 'Member Life',
          title: 'Orientation Day, Ramadan Nights & NVMSA Iftar',
          summary:
            'Welcomed 100 new members with a 6-reel recruitment drive, hosted 4 Ramadan Nights sessions, and gathered 50 members for the annual NVMSA Iftar Day.',
          metric: '85% active retention · 50 Iftar attendees',
          partners: 'All Standing Committees & Support Divisions',
        },
      ],
    },
    history: {
      heading: 'History & previous terms',
      intro:
        'Institutional memory matters. Browse the complete 2025/2026 End-of-Term Report alongside archive slots prepared for earlier founding terms.',
      presidentLabel: 'Word from the President',
      summaryLabel: 'Executive summary',
      rosterLabel: 'Term Team of Officials',
      placeholderBadge: 'Archive placeholder',
      terms: [
        {
          id: '2025-2026',
          label: '2025 / 2026',
          status: 'verified',
          themeTitle: 'End-Term Report 25/26 — "No Hero Without Wounds"',
          presidentName: 'Ayman Ashraf — NVMSA President 2025/2026',
          presidentQuote:
            '“Over the past three years, NVMSA has grown into a vibrant and dynamic community for our students, delivering a truly unparalleled experience. Together, we have created opportunities, fostered personal and professional development, inspired future generations, and positively impacted countless lives.”',
          executiveSummary: [
            'Maintained active standing committees and introduced online adaptability whenever physical availability was constrained, organizing 46 standing committee activities and 60 training sessions.',
            'Built an official local archiving system, master database, scoring framework, and monthly Officials meetings on the 20th of every month.',
            'Established the contract with the Safe Women Unit at the Faculty of Medicine, partnered with Y-PEER, and earned local sponsorship with Coffee & Book.',
          ],
          highlights: [
            '154,951+ online views across SCOPH, SCOME, SCORP, and SCORA',
            '85 active members retained from 100 recruits (85% retention)',
            '14 LC-LC collaborations & 3 external partnerships',
          ],
          officials: [
            { position: 'President', name: 'Ayman Ashraf', email: 'president.nvmsa@gmail.com' },
            { position: 'Sec-Gen', name: 'Abdelrhman Ahmed', email: 'sec.gen.nvmsa@gmail.com' },
            { position: 'Treasurer / FSDD', name: 'Ayman M. Ali', email: 'treasurer.nvmsa@gmail.com' },
            { position: 'VPI / VPE', name: 'Abeer Khairy Ahmed', email: 'vp.nvmsa@gmail.com' },
            { position: 'VPCB / CBSDD', name: 'Mohamed Maghraby', email: 'cbsdd.nvmsa@gmail.com' },
            { position: 'LEO', name: 'Maryam Emad', email: 'leo.nvmsa@gmail.com' },
            { position: 'LPO', name: 'Omar M. Ahmed', email: 'lpoo.nvmsa@gmail.com' },
            { position: 'LORA', name: 'Hana Mahmoud', email: 'lora.nvmsa@gmail.com' },
            { position: 'LOME', name: 'Mohammed Adel', email: 'lome.nvmsa@gmail.com' },
            { position: 'LORP', name: 'Zeinab Maher', email: 'lorp.nvmsa@gmail.com' },
            { position: 'PSDD', name: 'Mostafa Yasser', email: 'psdd.nvmsa@gmail.com' },
            { position: 'PNSDD', name: 'Ahmed Elfolly', email: 'pnsdd.nvmsa@gmail.com' },
            { position: 'RSDD', name: 'Ahmed Ashraf', email: 'rsdd.nvmsa@gmail.com' },
          ],
          metricsLine:
            '46 SC activities · 60 CB sessions · 325 workshop participants · 15 community impact actions · 9 SDGs',
        },
        {
          id: '2024-2025',
          label: '2024 / 2025',
          status: 'placeholder',
          themeTitle: '2024/2025 Term Archive (Placeholder — Awaiting Handover Records)',
          presidentName: '2024/2025 Executive Board — Archive Pending Digitization',
          presidentQuote:
            '“Archival slot reserved for the 2024/2025 President statement and verified handover metrics once the historical Google Drive sheets are attached.”',
          executiveSummary: [
            'This slot is intentionally left as a clean archive placeholder until the Secretary General and PNSD archive team supply the verified 2024/2025 roster and metrics.',
            'No historical numbers or names are fabricated.',
          ],
          highlights: [
            'Previous term roster slot ready in src/landing/content.ts',
            'Historical reach & activity counts pending verification',
          ],
          officials: [
            { position: 'President', name: 'Pending archive import', email: 'sec.gen.nvmsa@gmail.com' },
            { position: 'Executive Board & Officers', name: 'Archive handover sheet pending', email: 'pnsdd.nvmsa@gmail.com' },
          ],
          metricsLine: '2024/2025 verified metrics will appear here once supplied.',
        },
        {
          id: '2023-2024',
          label: '2023 / 2024',
          status: 'placeholder',
          themeTitle: '2023/2024 Founding Era Archive (Placeholder — Awaiting Handover Records)',
          presidentName: 'Founding & Early Terms — Archive Pending Digitization',
          presidentQuote:
            '“As noted in the 2025/2026 report, NVMSA grew over three years into a dynamic student community in New Valley. Founding-term records are being compiled for this archive.”',
          executiveSummary: [
            'Reserved for founding officers, early orientation milestones, and baseline local committee recognition records.',
          ],
          highlights: [
            'Founding timeline & past officials table slot ready',
          ],
          officials: [
            { position: 'Founding Officials', name: 'Pending archive import', email: 'sec.gen.nvmsa@gmail.com' },
          ],
          metricsLine: 'Founding-era metrics will appear here once supplied.',
        },
      ],
    },
    joinPartners: {
      joinHeading: 'Join as a member or volunteer',
      joinIntro:
        'NVMSA does not use a static year-round application form. Every recruitment wave, project OC call, and volunteer sign-up opens publicly on our official social media channels.',
      joinSteps: [
        {
          title: 'Follow official NVMSA channels',
          body: 'Watch our Instagram, Facebook page, and NVU Medicine Linktree hub for recruitment weeks, Orientation Day dates, and committee calls.',
        },
        {
          title: 'Attend Orientation & Committee 101s',
          body: 'Meet SCOPH, SCOME, SCORA, SCORP, SCOPE/SCORE, and Support Division leads before choosing where to contribute.',
        },
        {
          title: 'Step into active membership',
          body: 'Join buddy groups, campus booths, or national training waves — or message the relevant officer directly if you are already a New Valley medical student.',
        },
      ],
      followLabel: 'Follow NVMSA announcements',
      partnerHeading: 'Partners & Sponsors',
      partnerIntro:
        'We collaborate with university units, UN-aligned youth networks, sister medical student associations, and local New Valley businesses.',
      partners: [
        {
          name: 'Faculty of Medicine — New Valley University',
          kind: 'Academic Host',
          scope: 'NVUCOM 2026, 1st Student Research Conference, Art Rhythm, and campus campaigns',
        },
        {
          name: 'Safe Women Unit (NVU)',
          kind: 'Institutional Partner',
          scope: 'Formal awareness campaign agreement on gender equity and campus safety',
        },
        {
          name: 'Y-PEER Network',
          kind: 'Youth Health Partner',
          scope: 'Approved peer-education partnership and community awareness programming',
        },
        {
          name: 'UNFPA & Misr Foundation (Workshops)',
          kind: 'National Advocacy Forum',
          scope: 'Advanced Advocacy Workshops attended by NVMSA delegates',
        },
        {
          name: 'Coffee & Book',
          kind: 'Local Sponsor',
          scope: 'Local community sponsorship in El Kharga supporting student initiatives',
        },
        {
          name: '14 Sister IFMSA-Egypt LCs',
          kind: 'Inter-LC Coalition',
          scope: 'Joint campaigns with Aswan, Luxor, Minya, Assiut, Suez, Menofia, Benha, Azhar Cairo, MUST, Nahda, Horus, 6th October, and Alexandria National',
        },
      ],
      sponsorNote:
        'Interested in sponsoring medical conferences, health caravans, or student training in the New Valley? Reach our Treasurer or Project Support Director directly.',
      sponsorEmailCta: 'Email Treasurer',
      sponsorWhatsappCta: 'WhatsApp PSD Director',
      oasisColumnsAlt: 'Looking up at carved sandstone columns inside the Temple of Hibis in El Kharga Oasis',
    },
    faq: {
      heading: 'Frequently asked questions',
      intro: 'Practical answers for New Valley medical students, prospective volunteers, and external partners.',
      items: [
        {
          q: 'How do I join NVMSA as a member or volunteer?',
          a: 'Recruitment waves and volunteer calls are announced on our official Facebook, Instagram, and Linktree channels rather than through a permanent single form. Follow our channels or message the Secretary General on WhatsApp for the next intake window.',
        },
        {
          q: 'Who can join NVMSA?',
          a: 'Undergraduate medical students at the Faculty of Medicine, New Valley University can join Standing Committees and Support Divisions. Community partners, alumni, and local sponsors can collaborate on public health and conference initiatives.',
        },
        {
          q: 'How are official emails and WhatsApp contacts organized?',
          a: 'Each of the 13 official seats holds a dedicated @gmail.com role address (such as president.nvmsa@gmail.com or psdd.nvmsa@gmail.com) so continuity survives handovers. Direct WhatsApp links are listed for officials with published numbers.',
        },
        {
          q: 'What is NVMSA OS at /nvmsaOs?',
          a: 'NVMSA OS is our internal operations platform used by the Executive Board, Standing Committee Officers, and Support Division Directors to book the single daily publication slot without conflicts.',
        },
        {
          q: 'Can hospitals, NGOs, or local businesses sponsor NVMSA?',
          a: 'Yes. Contact our Treasurer (treasurer.nvmsa@gmail.com) or Project Support Division Director (psdd.nvmsa@gmail.com / +20 102 724 6280) to review event or merchandise sponsorship tiers.',
        },
        {
          q: 'Where can I view older term archives before 2025/2026?',
          a: 'The 2025/2026 End-of-Term Report ("No Hero Without Wounds") is fully published in the History section above. Earlier term sheets (2024/2025 and 2023/2024) are staged as archive slots awaiting digitized handover files.',
        },
      ],
    },
    contact: {
      heading: 'Contact the Executive Board',
      intro:
        'Reach our Executive Board directly via WhatsApp, official role email, or our social media channels.',
      ebDirectHeading: 'Executive Board direct lines',
      socialHeading: 'Social media & student hub',
      socialNote:
        'Follow our channels for recruitment openings, conference registration, and weekly committee announcements.',
      socialLinks: SOCIAL_LINKS_EN,
    },
    footer: {
      placeLine: 'El Kharga Oasis, New Valley Governorate, Egypt',
      osPrompt: 'Authorized official?',
      osLinkLabel: 'Launch NVMSA OS',
      photoCredit:
        'Hibis Temple & Kharga Oasis photographs via Wikimedia Commons: Roland Unger (CC BY-SA 4.0), Hanne Siegmeier (CC BY 2.0 / CC BY-SA 2.0), Fmaoi7 (CC BY-SA 4.0).',
      copyright: "New Valley Medical Students' Association (NVMSA)",
    },
    toastCopied: 'Copied to clipboard:',
    officials: OFFICIALS_EN,
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    alternatePath: '/',
    alternateLabel: 'English',
    meta: {
      title: 'NVMSA — جمعية طلاب طب الوادي الجديد',
      description:
        'الموقع الرسمي لجمعية طلاب طب الوادي الجديد (NVMSA) بكلية الطب جامعة الوادي الجديد بالخارجة: المكتب التنفيذي، اللجان الدائمة، تقارير الأثر 2025/2026، والتعاون والشراكات.',
    },
    skipToContent: 'تخطي إلى المحتوى الرئيسي',
    nav: {
      brandName: 'NVMSA',
      brandSub: 'الوادي الجديد',
      links: [
        { href: '#about', label: 'رسالتنا' },
        { href: '#team', label: 'الفريق' },
        { href: '#impact', label: 'الأثر' },
        { href: '#committees', label: 'اللجان' },
        { href: '#history', label: 'الأرشيف' },
        { href: '#join', label: 'انضم وشراكات' },
        { href: '#contact', label: 'التواصل' },
      ],
      osLabel: 'نظام NVMSA OS',
      menuOpenLabel: 'فتح القائمة',
      menuCloseLabel: 'إغلاق القائمة',
    },
    hero: {
      locationLine: 'كلية الطب البشري، جامعة الوادي الجديد — واحة الخارجة',
      headlineLines: [
        'طلاب الطب',
        'يصنعون أثراً صحياً',
        'في قلب الوادي الجديد.',
      ],
      lead: 'لجنة محلية فاعلة تابعة للاتحاد الدولي لجمعيات طلاب الطب في مصر (IFMSA-Egypt)، تجمع بين التدريب السريري، والتوعية الصحية في الواحات، والبحث العلمي، والقيادة الطلابية تحت بوابة معبد هيبس.',
      primaryCta: 'تعرّف على الفريق',
      secondaryCta: 'استعرض أثر 25/26',
      osCta: 'دخول نظام NVMSA OS',
      facts: [
        { value: '13', label: 'مقعداً رسمياً' },
        { value: '46', label: 'نشاطاً للجان (25/26)' },
        { value: '154,951+', label: 'مشاهدة توعوية موثقة' },
        { value: '9', label: 'أهداف تنمية مستدامة' },
      ],
      photoAlt: 'البوابة الشرقية الحجرية لمعبد هيبس وسط نخيل واحة الخارجة',
    },
    about: {
      heading: 'جذور في واحة الخارجة، وامتداد في أنحاء مصر',
      intro:
        'تمثل جمعية طلاب طب الوادي الجديد (NVMSA) طلاب كلية الطب بجامعة الوادي الجديد، وتجمع بين التعليم الطبي العملي وخدمة المجتمع في الصحراء الغربية.',
      paragraphs: [
        'يربط شعار الجمعية بين معبد هيبس الحجري في الخارجة وبين نبض القلب الذي يعلو بين أعمدته؛ تعبيراً عن أطباء المستقبل المتجذرين في محافظتهم والمنطلقين نحو أحدث المعايير الطبية والبحثية.',
        'من خلال اللجان الدائمة وأقسام الدعم المتخصصة، تتيح NVMSA للطلاب قيادة حملات ميدانية في المدارس والجامعة، وتنظيم المؤتمرات العلمية، وصقل مهارات البحث العلمي والتدريب القيادي.',
      ],
      pillars: [
        {
          title: 'الصحة المجتمعية في الواحة',
          body: 'حملات قياس العلامات الحيوية والإسعافات الأولية والتوعية المدرسية والرقمية التي تصل لعشرات الآلاف في الوادي الجديد والمحافظات الشريكة.',
        },
        {
          title: 'التأهيل السريري والبحثي',
          body: 'برامج تدريب للأقران في التفكير السريري، وجودة المناهج الطبية، ومناهج البحث العلمي، وإدارة المشروعات، وصناعة المحتوى الطبي.',
        },
        {
          title: 'شراكات بين المحافظات',
          body: 'مبادرات مشتركة مع 14 لجنة محلية شقيقة في أسوان والأقصر والمنيا وأسيوط والسويس والمنوفية وبنها والأزهر وجامعة مصر والنهضة وحورس.',
        },
      ],
      oasisPhotoAlt: 'منظر عام لمعبد هيبس وسط بساتين النخيل وهضبة الصحراء الغربية بالخارجة',
      colonnadePhotoAlt: 'أعمدة معبد هيبس الحجرية بتيجان البردي تحت ضوء شمس الخارجة',
    },
    team: {
      heading: 'فريق المسؤولين الحالي',
      intro:
        'ثلاثة عشر مقعداً قيادياً منتخباً ومكلفاً يديرون أعمال الجمعية عبر المكتب التنفيذي، واللجان الدائمة، وأقسام الدعم.',
      termBadge: 'تشكيل الدورة الحالية',
      filters: [
        { id: 'all', label: 'جميع المسؤولين', count: 13 },
        { id: 'eb', label: 'المكتب التنفيذي', count: 4 },
        { id: 'sc', label: 'اللجان الدائمة', count: 5 },
        { id: 'sd', label: 'أقسام الدعم', count: 4 },
      ],
      ebHeading: 'المكتب التنفيذي',
      scHeading: 'مسؤولو اللجان الدائمة',
      sdHeading: 'مديرو أقسام الدعم',
      columns: {
        code: 'الرمز',
        role: 'المنصب',
        official: 'المسؤول المعتمد',
        contact: 'قنوات التواصل',
      },
      copyEmailLabel: 'نسخ البريد',
      whatsappLabel: 'واتساب',
      emailLabel: 'بريد إلكتروني',
      sampleToggleClosed: 'معاينة منسقي اللجان والفريق العام (بيانات تجريبية)',
      sampleToggleOpen: 'إخفاء معاينة المنسقين',
      sampleNotice:
        'بيانات تجريبية للمعاينة فقط: تُحدَّث قوائم المنسقين مع كل موجة انضمام وتُعرض هنا كنماذج تنظيمية مؤقتة.',
      sampleCoordinators: [
        {
          name: 'منسقو الحملات واللوجستيات (نموذج)',
          role: 'تنظيم الميدان والموافقات',
          unit: 'SCOPH / PSD',
          focus: 'تجهيز نقاط الفحص الميداني والتصاريح الجامعية',
        },
        {
          name: 'قادة مجموعات Buddy Groups (نموذج)',
          role: 'التعليم الطبي للأقران',
          unit: 'SCOME',
          focus: 'حلقات التفكير السريري ومتابعة تقييم الأعضاء',
        },
        {
          name: 'منسقو التوعية والمناصرة (نموذج)',
          role: 'الحملات المشتركة',
          unit: 'SCORA × SCORP',
          focus: 'حملة 16 يوماً لمناهضة العنف والتوعية المدرسية',
        },
        {
          name: 'فريق الإبداع والأرشفة (نموذج)',
          role: 'التصميم والريلز والتوثيق',
          unit: 'PNSD',
          focus: 'الالتزام بالهوية البصرية والأرشفة الشهرية المنتظمة',
        },
      ],
    },
    impact: {
      heading: 'الأثر الموثق في دورة 2025/2026',
      intro:
        'جميع الأرقام التالية مأخوذة مباشرة من التقرير الختامي المعتمد لدورة 2025/2026 عبر الوصول الرقمي والتدريب الميداني والتعاون المشترك.',
      kpis: [
        {
          value: '154,951+',
          label: 'مشاهدة رقمية موثقة',
          detail: 'إجمالي الوصول عبر حملات SCOPH و SCOME و SCORP و SCORA',
        },
        {
          value: '46',
          label: 'نشاطاً للجان الدائمة',
          detail: 'SCORA (15) · SCOME (13) · SCOPH (11) · SCORP (7)',
        },
        {
          value: '85%',
          label: 'استمرارية الأعضاء الفاعلين',
          detail: '85 عضواً نشطاً في نهاية الدورة من أصل 100 عضو جديد',
        },
        {
          value: '60',
          label: 'جلسة تدريب وبناء قدرات',
          detail: '43 جلسة للجان الدائمة + 17 جلسة لأقسام الدعم بمشاركة 48 مدرباً',
        },
        {
          value: '325',
          label: 'متدرباً في ورش اللجان',
          detail: 'إضافة إلى 200 مستفيد ميداني و50 مشاركاً في إفطار NVMSA',
        },
        {
          value: '17',
          label: 'شراكة وتعاون مشترك',
          detail: '14 تعاوناً مع اللجان المحلية + 3 شراكات خارجية ومؤسسية',
        },
      ],
      lensHeading: 'قارن مخرجات اللجان الدائمة حسب المعيار',
      lenses: [
        { id: 'online', label: 'الوصول الرقمي', unit: 'مشاهدة' },
        { id: 'activities', label: 'عدد الأنشطة', unit: 'نشاط' },
        { id: 'sessions', label: 'الجلسات التدريبية', unit: 'جلسة' },
        { id: 'participants', label: 'المشاركون بالتدريب', unit: 'متدرب' },
      ],
      committees: [
        {
          code: 'SCOME',
          name: 'التعليم الطبي',
          activities: 13,
          onlineReach: 60000,
          onlineDisplay: '60,000+',
          offlineReach: 100,
          sessions: 11,
          trainers: 11,
          participants: 75,
        },
        {
          code: 'SCORA',
          name: 'الصحة الإنجابية',
          activities: 15,
          onlineReach: 35496,
          onlineDisplay: '35,496',
          offlineReach: 50,
          sessions: 21,
          trainers: 12,
          participants: 150,
        },
        {
          code: 'SCORP',
          name: 'حقوق الإنسان والسلام',
          activities: 7,
          onlineReach: 31409,
          onlineDisplay: '31,409',
          offlineReach: 20,
          sessions: 9,
          trainers: 7,
          participants: 70,
        },
        {
          code: 'SCOPH',
          name: 'الصحة العامة',
          activities: 11,
          onlineReach: 28046,
          onlineDisplay: '28,046',
          offlineReach: 30,
          sessions: 2,
          trainers: 2,
          participants: 30,
        },
      ],
      sdHeading: 'تدريب وبناء قدرات أقسام الدعم (2025/2026)',
      sdUnitLabel: 'جلسات',
      sdRows: [
        { code: 'CBSD', sessions: 8, trainers: 8 },
        { code: 'PSD', sessions: 3, trainers: 3 },
        { code: 'PNSD', sessions: 3, trainers: 1 },
        { code: 'RSD', sessions: 2, trainers: 3 },
        { code: 'FSD', sessions: 1, trainers: 1 },
      ],
      sdgHeading: '9 أهداف للأمم المتحدة للتنمية المستدامة تم العمل عليها',
      sdgs: [
        'الهدف 3: الصحة الجيدة والرفاه',
        'الهدف 4: التعليم الجيد',
        'الهدف 5: المساواة بين الجنسين',
        'الهدف 6: المياه النظيفة والنظافة الصحية',
        'الهدف 8: العمل اللائق ونمو الاقتصاد',
        'الهدف 10: الحد من أوجه عدم المساواة',
        'الهدف 11: مدن ومجتمعات محلية مستدامة',
        'الهدف 13: العمل المناخي',
        'الهدف 16: السلام والعدل والمؤسسات القوية',
      ],
    },
    committees: {
      heading: 'اللجان الدائمة وأقسام الدعم',
      intro:
        'اختر أي لجنة دائمة أو قسم دعم للاطلاع على اختصاصه، ومسؤوله الحالي، وأبرز إنجازاته الموثقة.',
      scGroupLabel: 'اللجان الدائمة',
      sdGroupLabel: 'أقسام الدعم',
      officerLabel: 'المسؤول الحالي',
      highlightsLabel: 'أبرز أنشطة 2025/2026 الموثقة',
      units: [
        {
          id: 'SCOPH',
          group: 'sc',
          code: 'SCOPH',
          name: 'اللجنة الدائمة للصحة العامة',
          officerCode: 'LPO',
          officerName: 'عمر محمد',
          officerEmail: 'lpoo.nvmsa@gmail.com',
          summary:
            'تعزز الثقافة الوقائية، والتوعية بالأمراض غير السارية، والصحة النفسية، ومبادرات التغطية الصحية الشاملة.',
          highlights: [
            'اليوم العالمي للسكري، وفيديو توعوي عن التدخين، ومنشور التوعية بمرض ألزهايمر',
            'حملة اليوم العالمي للتغطية الصحية الشاملة بالشراكة مع أسوان والأزهر والأقصر والمنيا والنهضة',
            'حملة الصحة النفسية لطلاب الطب والممارسين الصحيين واليوم العالمي للصحة النفسية',
          ],
          statLine: '11 نشاطاً · 28,046 مشاهدة · 30 مشاركاً بالتدريب',
        },
        {
          id: 'SCOME',
          group: 'sc',
          code: 'SCOME',
          name: 'اللجنة الدائمة للتعليم الطبي',
          officerCode: 'LOME',
          officerName: 'زين وائل',
          officerEmail: 'lome.nvmsa@gmail.com',
          summary:
            'تؤهل طلاب الطب بالمهارات السريرية، وفهم المناهج والاعتماد، وتقود مجموعات التعلم التعاوني Buddy Groups.',
          highlights: [
            'الحملات الميدانية للعلامات الحيوية (Vital Signs) وإدارة الوقت داخل الكلية',
            'جلسات التفكير السريري، والرقمنة الطبية، وMedicine Decoded، وجودة المناهج والاعتماد',
            'مبادرة العيادات الرمضانية بالتعاون مع SCOPH وحملة العلاج بالموسيقى للتوحد وباركنسون',
          ],
          statLine: '13 نشاطاً · +60,000 مشاهدة · 11 جلسة تدريب',
        },
        {
          id: 'SCORA',
          group: 'sc',
          code: 'SCORA',
          name: 'اللجنة الدائمة للصحة والحقوق الإنجابية',
          officerCode: 'LORA',
          officerName: 'شهد تامر',
          officerEmail: 'lora.nvmsa@gmail.com',
          summary:
            'تقدم توعية علمية رصينة حول صحة الأمومة، والصحة الإنجابية، وتكافؤ الفرص، ومناهضة العنف.',
          highlights: [
            'حملة "The Missing Chapter" لليوم العالمي للصحة الإنجابية مع 6 لجان محلية مصرية',
            'حملة 16 يوماً لمناهضة العنف وندوة "No More Hush" المشتركة مع SCORP',
            'فعالية SCORA Cafe الحوارية وحملة اليوم العالمي للمرأة',
          ],
          statLine: '15 نشاطاً · 35,496 مشاهدة · 150 متدرباً',
        },
        {
          id: 'SCORP',
          group: 'sc',
          code: 'SCORP',
          name: 'اللجنة الدائمة لحقوق الإنسان والسلام',
          officerCode: 'LORP',
          officerName: null,
          officerEmail: 'lorp.nvmsa@gmail.com',
          summary:
            'تدعم العدالة الصحية، ومناهضة الوصم، وحقوق الفئات الأكثر احتياجاً، ومبادئ حقوق الإنسان في الرعاية الصحية.',
          highlights: [
            'حملة الفجوة الجندرية في الصحة بالشراكة مع جامعتي حورس وأسيوط',
            'مشروع Together Against Stigma، واليوم العالمي للتوحد، وحقوق الإنسان مع SCOME',
            'أنشطة التوعية المشتركة حول العنف ضد المرأة وجلسة Pink & Blue Diseases مع SCORA',
          ],
          statLine: '7 أنشطة · 31,409 مشاهدات · 70 متدرباً',
        },
        {
          id: 'SCOPE-SCORE',
          group: 'sc',
          code: 'SCOPE & SCORE',
          name: 'التبادل الطلابي والتبادل البحثي',
          officerCode: 'LEO & LORE',
          officerName: 'إيهاب مختار',
          officerEmail: 'leo.lore.nvmsa@gmail.com',
          summary:
            'تنسق فرص التبادل الإكلينيكي والبحثي عبر شبكة IFMSA-Egypt وتُعدّ الطلاب لمتطلبات القبول الدولية.',
          highlights: [
            'توحيد مسؤوليتي LEO و LORE في مقعد إشرافي مباشر خلال الدورة الحالية',
            'توجيه طلاب كلية طب الوادي الجديد لمسارات التبادل السريري والبحثي',
            'تنسيق الجاهزية البحثية والسريرية بالتكامل مع RSD و SCOME',
          ],
          statLine: 'مكتب التبادل السريري والبحثي',
        },
        {
          id: 'CBSD',
          group: 'sd',
          code: 'CBSD',
          name: 'قسم دعم بناء القدرات',
          officerCode: 'CBSDD',
          officerName: 'أحمد سامح',
          officerEmail: 'cbsdd.nvmsa@gmail.com',
          summary:
            'يبني مهارات القيادة والعمل الجماعي وحل المشكلات وإدارة المشروعات لجميع أعضاء الجمعية.',
          highlights: [
            'حزمة المهارات الشخصية: CB 101، العمل الجماعي، التوثيق، أدوات جوجل، وحل النزاعات',
            'ورش اللجان المشتركة: إدارة المشروعات 101، التقييم والمتابعة، والتشبيك والعرض السريع',
            'تنفيذ 8 جلسات بناء قدرات بمشاركة 8 مدربين خلال دورة 2025/2026',
          ],
          statLine: '8 جلسات · 8 مدربين في دورة 25/26',
        },
        {
          id: 'PSD',
          group: 'sd',
          code: 'PSD',
          name: 'قسم دعم المشروعات',
          officerCode: 'PSDD',
          officerName: 'محمد عمران',
          officerEmail: 'psdd.nvmsa@gmail.com',
          summary:
            'يحوّل الأفكار الطلابية إلى مشروعات معتمدة عبر كتابة المقترحات، وتنظيم اللوجستيات، والمتابعة والتقييم.',
          highlights: [
            'تدريبات كتابة المقترحات، ونماذج التقديم، وقراءة الأوراق البحثية، وإدارة اللوجستيات',
            'المشاركة في يوم الاستقطاب وتقديم جلسات إدارة المشروعات مع CBSD',
            'استصدار الموافقات الرسمية ليوم التعريف، وحملات المدارس، ومؤتمر NVUCOM 2026',
          ],
          statLine: '3 جلسات · تنسيق الموافقات واللوجستيات',
        },
        {
          id: 'PNSD',
          group: 'sd',
          code: 'PNSD',
          name: 'قسم النشر والتكنولوجيا الحديثة',
          officerCode: 'PNSDD',
          officerName: 'أحمد الفولي',
          officerEmail: 'pnsdd.nvmsa@gmail.com',
          summary:
            'يدير الهوية البصرية لـ NVMSA، والمحتوى الرقمي، وتحليلات النشر، والأنظمة التقنية وعلى رأسها NVMSA OS.',
          highlights: [
            'إصدار دليلين تنظيميين (دليل الهوية البصرية ولوائح النشر والإدارة الرقمية)',
            'إنتاج 8 مقاطع Reels و5 منشورات رئيسية وتصميمات الشراكة خلال 4 ساعات تدريب تخصصية',
            'تأهيل الأعضاء في التصميم الجرافيكي والمونتاج وقراءة إحصاءات التفاعل',
          ],
          statLine: '4 ساعات تدريب · دليلان تنظيميّان',
        },
        {
          id: 'RSD',
          group: 'sd',
          code: 'RSD',
          name: 'قسم دعم البحث العلمي',
          officerCode: 'RSDD',
          officerName: 'محمد محمود',
          officerEmail: 'rsdd.nvmsa@gmail.com',
          summary:
            'يرسّخ منهجية البحث الطبي لدى الطلاب من صياغة الفرضية وحتى المشاركة في المؤتمرات العلمية.',
          highlights: [
            'حملة "From Hypothesis To Evidence" الإلكترونية لأساسيات البحث بالتعاون مع MSSA-Menofia',
            'المشاركة في تنظيم المؤتمر البحثي الطلابي الأول لكلية طب جامعة الوادي الجديد',
            'تقييم احتياجات البحث العلمي لدى الأعضاء والمشاركة الميدانية في حملة العلامات الحيوية',
          ],
          statLine: 'جلستان · المؤتمر البحثي الطلابي الأول',
        },
        {
          id: 'FSD',
          group: 'sd',
          code: 'FSD',
          name: 'قسم الدعم المالي',
          officerCode: 'TREAS',
          officerName: 'محمد عادل',
          officerEmail: 'treasurer.nvmsa@gmail.com',
          summary:
            'يدير الاستدامة المالية، وباقات العضوية، وعقود الرعاية المحلية، والتمثيل المالي في الاتحاد الوطني.',
          highlights: [
            'إعداد باقة عضوية NVMSA والمقتنيات الخاصة وقائمة الرعاة المحتملين',
            'توقيع رعاية محلية مع Coffee & Book وتمثيل الجمعية في الجمعية العمومية الأولى',
            'تمثيل وطني في فريق جمع التبرعات عبر مصطفى ياسر كجامع بيانات',
          ],
          statLine: 'مبادرتان ماليتان · بإشراف أمين الصندوق',
        },
      ],
    },
    campaigns: {
      heading: 'أبرز الفعاليات والتمثيل الوطني',
      intro:
        'من المؤتمرات الطبية داخل جامعة الوادي الجديد إلى التحالفات التوعوية بين ست محافظات والتمثيل الرسمي في مؤتمرات IFMSA-Egypt.',
      items: [
        {
          id: 'nvucom',
          tag: 'المؤتمرات والكلية',
          title: 'مؤتمر NVUCOM 2026 والمؤتمر البحثي الطلابي الأول',
          summary:
            'المشاركة في تنظيم المؤتمر الطبي الخامس لكلية الطب (NVUCOM 2026)، والمؤتمر البحثي الطلابي الأول، والمعرض الفني الأول بالكلية "Art Rhythm".',
          metric: '3 فعاليات كبرى على مستوى الكلية',
          partners: 'كلية الطب، جامعة الوادي الجديد',
        },
        {
          id: 'uhc',
          tag: 'تحالف صحة عامة · SCOPH × SCOME',
          title: 'تحالف 6 لجان محلية للتغطية الصحية الشاملة',
          summary:
            'تنظيم حملة رقمية مشتركة في اليوم العالمي للتغطية الصحية الشاملة جمعت ست جمعيات طلابية من الصعيد والدلتا والقاهرة.',
          metric: '6 لجان محلية متحدة',
          partners: 'أسوان · الأزهر القاهرة · الأقصر · المنيا · النهضة',
        },
        {
          id: 'gbv',
          tag: 'مناصرة · SCORA × SCORP',
          title: 'حملة The Missing Chapter و16 يوماً لمناهضة العنف',
          summary:
            'إطلاق حملات الصحة الإنجابية وصحة الأم وندوة "No More Hush"، مع إبرام اتفاق تعاون مع وحدة المرأة الآمنة بالكلية.',
          metric: '35,496+ مشاهدة SCORA · 31,409 SCORP',
          partners: 'وحدة المرأة الآمنة · Y-PEER · بنها · السويس · المنوفية · 6 أكتوبر',
        },
        {
          id: 'clinical',
          tag: 'مهارات سريرية · SCOME',
          title: 'حملات العلامات الحيوية والإسعافات الأولية',
          summary:
            'تنفيذ حملات ميدانية للعلامات الحيوية والإسعافات الأولية، بالتوازي مع جلسات التفكير السريري والرقمنة وجودة التعليم الطبي.',
          metric: '+60,000 مشاهدة · 100 مستفيد ميداني',
          partners: 'SCOME و RSD',
        },
        {
          id: 'national',
          tag: 'التمثيل الوطني',
          title: 'الجمعيات العمومية NGA وورش UNFPA ومؤسسة مصر',
          summary:
            'تمثيل الوادي الجديد في الجمعية العمومية الأولى والثالثة، ومعسكر الشتاء، وورشة AMET، ومختبر RH Lab، وورش المناصرة المتقدمة.',
          metric: '6 محافل وتدريبات وطنية',
          partners: 'IFMSA-Egypt · UNFPA · مؤسسة مصر',
        },
        {
          id: 'community',
          tag: 'حياة الأعضاء',
          title: 'يوم التعريف، ليالي رمضان، وإفطار NVMSA السنوي',
          summary:
            'استقطاب 100 عضو جديد بحملة من 6 مقاطع Reels، وتنظيم 4 جلسات في ليالي رمضان، وإفطار جماعي ضم 50 مشاركاً.',
          metric: '85% استمرارية · 50 مشاركاً بالإفطار',
          partners: 'كافة اللجان الدائمة وأقسام الدعم',
        },
      ],
    },
    history: {
      heading: 'التاريخ والدورات السابقة',
      intro:
        'الذاكرة المؤسسية أساس الاستمرارية. تصفح التقرير الختامي الموثق لدورة 2025/2026 إلى جانب مساحات الأرشيف المخصصة للدورات التأسيسية السابقة.',
      presidentLabel: 'كلمة الرئيس',
      summaryLabel: 'الملخص التنفيذي',
      rosterLabel: 'تشكيل فريق المسؤولين بالدورة',
      placeholderBadge: 'أرشيف قيد الاستكمال',
      terms: [
        {
          id: '2025-2026',
          label: '2025 / 2026',
          status: 'verified',
          themeTitle: 'التقرير الختامي 25/26 — "No Hero Without Wounds"',
          presidentName: 'أيمن أشرف — رئيس NVMSA لدورة 2025/2026',
          presidentQuote:
            '«خلال السنوات الثلاث الماضية، نمت NVMSA لتصبح مجتمعاً حيوياً وديناميكياً لطلابنا، تمنحهم تجربة استثنائية وتصنع الفرص وتلهم الأجيال القادمة. كل ما تحقق هو ثمرة تفاني وإبداع فريق المسؤولين.»',
          executiveSummary: [
            'الحفاظ على نشاط اللجان الدائمة وتطويع الأنشطة الرقمية لتعزيز المشاركة، مع تنظيم 46 نشاطاً للجان و60 جلسة بناء قدرات.',
            'تأسيس نظام أرشفة محلي موحد، وقاعدة بيانات رئيسية، ونظام تقييم للأعضاء، واجتماع شهري ثابت لفريق المسؤولين يوم 20 من كل شهر.',
            'تفعيل التعاون مع وحدة المرأة الآمنة بالكلية، واعتماد الشراكة مع منظمة Y-PEER، وتأمين رعاية Coffee & Book.',
          ],
          highlights: [
            '+154,951 مشاهدة توعوية عبر SCOPH و SCOME و SCORP و SCORA',
            'الحفاظ على 85 عضواً فاعلاً من أصل 100 عضو جديد (85%)',
            '14 تعاوناً مع اللجان المحلية و3 شراكات خارجية',
          ],
          officials: [
            { position: 'President', name: 'أيمن أشرف', email: 'president.nvmsa@gmail.com' },
            { position: 'Sec-Gen', name: 'عبد الرحمن أحمد', email: 'sec.gen.nvmsa@gmail.com' },
            { position: 'Treasurer / FSDD', name: 'أيمن م. علي', email: 'treasurer.nvmsa@gmail.com' },
            { position: 'VPI / VPE', name: 'عبير خيري أحمد', email: 'vp.nvmsa@gmail.com' },
            { position: 'VPCB / CBSDD', name: 'محمد مغربي', email: 'cbsdd.nvmsa@gmail.com' },
            { position: 'LEO', name: 'مريم عماد', email: 'leo.nvmsa@gmail.com' },
            { position: 'LPO', name: 'عمر م. أحمد', email: 'lpoo.nvmsa@gmail.com' },
            { position: 'LORA', name: 'هنا محمود', email: 'lora.nvmsa@gmail.com' },
            { position: 'LOME', name: 'محمد عادل', email: 'lome.nvmsa@gmail.com' },
            { position: 'LORP', name: 'زينب ماهر', email: 'lorp.nvmsa@gmail.com' },
            { position: 'PSDD', name: 'مصطفى ياسر', email: 'psdd.nvmsa@gmail.com' },
            { position: 'PNSDD', name: 'أحمد الفولي', email: 'pnsdd.nvmsa@gmail.com' },
            { position: 'RSDD', name: 'أحمد أشرف', email: 'rsdd.nvmsa@gmail.com' },
          ],
          metricsLine:
            '46 نشاطاً للجان · 60 جلسة تدريب · 325 متدرباً · 15 أثراً مجتمعياً · 9 أهداف تنمية مستدامة',
        },
        {
          id: '2024-2025',
          label: '2024 / 2025',
          status: 'placeholder',
          themeTitle: 'أرشيف دورة 2024/2025 (بانتظار إرفاق سجلات التسليم)',
          presidentName: 'المكتب التنفيذي 2024/2025 — قيد الأرشفة',
          presidentQuote:
            '«مساحة أرشيفية مخصصة لكلمة رئيس دورة 2024/2025 وملخص الإنجازات الموثق فور استلام ملفات الأرشيف الرسمية.»',
          executiveSummary: [
            'تُترك هذه المساحة واضحة كأرشيف قيد التوثيق دون اختلاق أي أسماء أو أرقام غير موثقة.',
          ],
          highlights: [
            'قائمة المسؤولين الرسمية جاهزة للاستيراد في ملف المحتوى',
            'إحصاءات الدورة بانتظار المراجعة النهائية',
          ],
          officials: [
            { position: 'President', name: 'قيد استيراد الأرشيف', email: 'sec.gen.nvmsa@gmail.com' },
            { position: 'فريق المسؤولين', name: 'بانتظار كشوف التسليم', email: 'pnsdd.nvmsa@gmail.com' },
          ],
          metricsLine: 'ستظهر أرقام دورة 2024/2025 هنا فور توفر السجلات المعتمدة.',
        },
        {
          id: '2023-2024',
          label: '2023 / 2024',
          status: 'placeholder',
          themeTitle: 'أرشيف التأسيس 2023/2024 (بانتظار إرفاق السجلات)',
          presidentName: 'الدفعات التأسيسية — قيد التوثيق',
          presidentQuote:
            '«كما وثّق تقرير 2025/2026، تأسست ونمت NVMSA على مدار ثلاث سنوات لتصبح ركيزة للعمل الطلابي الطبي في الوادي الجديد.»',
          executiveSummary: [
            'مساحة مخصصة لتوثيق المؤسسين الأوائل ومحطات التأسيس والاعتراف المحلي.',
          ],
          highlights: [
            'الخط الزمني للتأسيس وقائمة المؤسسين جاهزة للتحديث',
          ],
          officials: [
            { position: 'المؤسسون', name: 'قيد استيراد الأرشيف', email: 'sec.gen.nvmsa@gmail.com' },
          ],
          metricsLine: 'ستُعرض إحصاءات المرحلة التأسيسية فور تزويدنا بها.',
        },
      ],
    },
    joinPartners: {
      joinHeading: 'انضم كعضو أو متطوع',
      joinIntro:
        'لا تعتمد NVMSA نموذج تسجيل موحداً دائماً؛ بل نعلن عن موجات العضوية والتطوع واللجان التنظيمية فور فتحها عبر حساباتنا الرسمية على منصات التواصل الاجتماعي.',
      joinSteps: [
        {
          title: 'تابع قنوات NVMSA الرسمية',
          body: 'ننشر مواعيد الاستقطاب ويوم التعريف Orientation Day ودعوات اللجان عبر إنستغرام وفيسبوك وبوابة كلية الطب.',
        },
        {
          title: 'احضر يوم التعريف وجلسات 101',
          body: 'تعرّف عن قرب على SCOPH و SCOME و SCORA و SCORP و SCOPE/SCORE وأقسام الدعم قبل اختيار مسارك.',
        },
        {
          title: 'شارك في الميدان والتدريب',
          body: 'انضم لحملات التوعية أو مجموعات التعلم، أو تواصل مباشرة مع مسؤول اللجنة عبر واتساب إذا كنت من طلاب طب الوادي الجديد.',
        },
      ],
      followLabel: 'تابع إعلانات الانضمام',
      partnerHeading: 'الشركاء والرعاة',
      partnerIntro:
        'نتعاون مع المؤسسات الجامعية، وشبكات الشباب الصحية، واللجان الطلابية الشقيقة، والداعمين المحليين في محافظة الوادي الجديد.',
      partners: [
        {
          name: 'كلية الطب — جامعة الوادي الجديد',
          kind: 'الحاضنة الأكاديمية',
          scope: 'مؤتمر NVUCOM 2026، والمؤتمر البحثي الطلابي الأول، ومعرض Art Rhythm، والحملات الطلابية',
        },
        {
          name: 'وحدة المرأة الآمنة (جامعة الوادي الجديد)',
          kind: 'شريك مؤسسي',
          scope: 'اتفاق تعاون رسمي لتنفيذ حملات التوعية والمساواة وسلامة الحرم الجامعي',
        },
        {
          name: 'شبكة Y-PEER',
          kind: 'شريك توعوي',
          scope: 'شراكة معتمدة في التوعية الصحية وتثقيف الأقران',
        },
        {
          name: 'ورش صندوق الأمم المتحدة للسكان UNFPA ومؤسسة مصر',
          kind: 'تدريب وطني',
          scope: 'ورش المناصرة المتقدمة بمشاركة ممثلي الجمعية',
        },
        {
          name: 'Coffee & Book',
          kind: 'راعي محلي',
          scope: 'رعاية مجتمعية محلية بالخارجة لدعم الأنشطة الطلابية',
        },
        {
          name: '14 لجنة محلية شقيقة بـ IFMSA-Egypt',
          kind: 'تحالف طلابي',
          scope: 'حملات مشتركة مع أسوان والأقصر والمنيا وأسيوط والسويس والمنوفية وبنها والأزهر ومصر والنهضة وحورس و6 أكتوبر والإسكندرية الأهلية',
        },
      ],
      sponsorNote:
        'هل ترغب في رعاية مؤتمراتنا الطبية أو قوافلنا التوعوية أو برامج التدريب في الوادي الجديد؟ تواصل مباشرة مع أمين الصندوق أو مدير دعم المشروعات.',
      sponsorEmailCta: 'مراسلة أمين الصندوق',
      sponsorWhatsappCta: 'واتساب مدير المشروعات',
      oasisColumnsAlt: 'أعمدة الحجر الرملي المنقوشة داخل معبد هيبس بالخارجة',
    },
    faq: {
      heading: 'الأسئلة الشائعة',
      intro: 'إجابات واضحة لطلاب طب الوادي الجديد والمتطوعين والجهات الراغبة في الشراكة.',
      items: [
        {
          q: 'كيف يمكنني الانضمام إلى NVMSA كعضو أو متطوع؟',
          a: 'لا يوجد نموذج تسجيل دائم موحد؛ إذ نعلن عن فتح باب العضوية والتطوع واللجان التنظيمية عبر صفحاتنا الرسمية على فيسبوك وإنستغرام. يمكنك متابعتنا أو مراسلة الأمين العام على واتساب لمعرفة موعد الموجة القادمة.',
        },
        {
          q: 'من يحق له الانضمام إلى الجمعية؟',
          a: 'طلاب كلية الطب البشري بجامعة الوادي الجديد يمكنهم التقديم في اللجان الدائمة وأقسام الدعم. كما نرحب بالتعاون مع الشركاء المجتمعيين والخريجين في المبادرات التوعوية والمؤتمرات.',
        },
        {
          q: 'كيف تُدار رسائل البريد والواتساب الرسمية؟',
          a: 'يمتلك كل منصب من المناصب الثلاثة عشر بريداً رسمياً مخصصاً (مثل president.nvmsa@gmail.com و psdd.nvmsa@gmail.com) لضمان استمرارية التواصل عبر الدورات، إلى جانب أرقام واتساب المباشرة المعلنة.',
        },
        {
          q: 'ما هو نظام NVMSA OS على المسار /nvmsaOs؟',
          a: 'هو نظام التشغيل الداخلي للجمعية، يتيح للمكتب التنفيذي ومسؤولي اللجان وأقسام الدعم حجز وتنظيم جدول النشر اليومي الموحد بدون تعارض.',
        },
        {
          q: 'كيف يمكن للمؤسسات أو الشركات المحلية رعاية أنشطة NVMSA؟',
          a: 'بالتواصل المباشر مع أمين الصندوق (treasurer.nvmsa@gmail.com) أو مدير قسم دعم المشروعات (psdd.nvmsa@gmail.com / +20 102 724 6280) لمناقشة باقات رعاية الفعاليات والمؤتمرات.',
        },
        {
          q: 'أين أجد تقارير الدورات الأقدم من 2025/2026؟',
          a: 'التقرير الكامل لدورة 2025/2026 منشور بالأرقام في قسم التاريخ والأرشيف أعلاه، بينما تم تجهيز مساحات أرشيف 2024/2025 و2023/2024 لإدراج بياناتها فور استلام ملفات التسليم الرسمية.',
        },
      ],
    },
    contact: {
      heading: 'تواصل مع المكتب التنفيذي',
      intro:
        'تواصل مباشرة مع المكتب التنفيذي عبر واتساب أو البريد الإلكتروني الرسمي، أو تابع قنواتنا على منصات التواصل الاجتماعي.',
      ebDirectHeading: 'قنوات المكتب التنفيذي المباشرة',
      socialHeading: 'منصات التواصل وبوابة الكلية',
      socialNote:
        'تابع صفحاتنا لمعرفة مواعيد التقديم الجديدة، وفتح التسجيل في المؤتمرات، وجدول الحملات الأسبوعي.',
      socialLinks: SOCIAL_LINKS_AR,
    },
    footer: {
      placeLine: 'واحة الخارجة، محافظة الوادي الجديد، مصر',
      osPrompt: 'هل أنت من مسؤولي الجمعية؟',
      osLinkLabel: 'فتح نظام NVMSA OS',
      photoCredit:
        'صور معبد هيبس وواحة الخارجة من ويكيميديا كومنز: Roland Unger (CC BY-SA 4.0)، Hanne Siegmeier (CC BY 2.0 / CC BY-SA 2.0)، Fmaoi7 (CC BY-SA 4.0).',
      copyright: 'جمعية طلاب طب الوادي الجديد (NVMSA)',
    },
    toastCopied: 'تم النسخ:',
    officials: OFFICIALS_AR,
  },
};
