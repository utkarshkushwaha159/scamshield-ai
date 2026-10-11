import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'ScamShield AI',
      tagline: 'Financial Scam Intelligence & Early-Warning Platform',
      nav: {
        home: 'Home',
        submit: 'Submit Evidence',
        history: 'Case History',
        graph: 'Evidence Graph',
        analyst: 'Analyst Portal',
        admin: 'Admin Center',
        login: 'Login',
        logout: 'Logout',
        myCases: 'My Reports'
      },
      helpline: {
        banner: 'National Cyber Fraud Helpline: 1930',
        callBtn: 'Call 1930',
        note: 'Dial 1930 immediately if financial loss has occurred or is imminent. (Clicking opens your dialer; calls are never initiated automatically)'
      },
      submit: {
        title: 'Submit Suspicious Financial Interaction',
        subtitle: 'Analyze deceptive UPI, banking, KYC, cashback, or digital wallet workflows with explainable AI heuristics.',
        privacyWarning: 'CRITICAL PRIVACY SAFEGUARD: Do not submit OTPs, UPI PINs, passwords, or banking credentials. ScamShield AI operates on zero-credential access.',
        evidenceType: 'Evidence Channel',
        sender: 'Sender / Phone / Handle',
        senderPlaceholder: 'e.g. +91 98765 43210 or SMS header VK-DISCOM',
        content: 'Suspicious Message / URL / Content',
        contentPlaceholder: 'Paste the exact suspicious message or URL (in any Indian language or script: English, Hindi, Hinglish, Bengali, etc.)...',
        notes: 'Context & Observation Notes (Optional)',
        notesPlaceholder: 'Describe how you received this or what the caller requested...',
        consentLabel: 'I confirm this interaction is voluntarily submitted for deceptive fraud analysis and contains no personal credentials.',
        analyzeBtn: 'Analyze Scam Workflow',
        analyzingBtn: 'Correlating & Scoring...',
        multilingualTip: 'You can submit in any language (Hindi, Hinglish, Bengali, Tamil, etc.). Original Unicode text is preserved without tampering.'
      },
      analysis: {
        title: 'Explainable Risk Assessment',
        riskScore: 'Risk Score',
        threatType: 'Primary Modus Operandi',
        uncertainty: 'Uncertainty Rating',
        sourceLang: 'Detected Language',
        originalEvidence: 'Original Evidence (Preserved Unicode)',
        machineTranslation: 'Machine Translation',
        viewOriginal: 'Original',
        viewTranslation: 'Translation',
        indicatorsTitle: 'Identified Deceptive Indicators & Rule Matches',
        actionsTitle: 'Immediate Recommended Safety Actions',
        deleteCase: 'Delete This Report (Privacy Purge)',
        deleteConfirm: 'Are you sure you want to permanently delete this report? This action cannot be undone.',
        shareReport: 'Copy Case Reference'
      },
      roles: {
        user: 'User',
        analyst: 'Analyst',
        admin: 'Administrator'
      }
    }
  },
  hi: {
    translation: {
      appName: 'स्कैमशील्ड AI',
      tagline: 'वित्तीय धोखाधड़ी इंटेलिजेंस और चेतावनी प्लेटफॉर्म',
      nav: {
        home: 'होम',
        submit: 'साक्ष्य दर्ज करें',
        history: 'केस इतिहास',
        graph: 'एविडेंस ग्राफ',
        analyst: 'विश्लेषक पोर्टल',
        admin: 'व्यवस्थापक',
        login: 'लॉग इन',
        logout: 'लॉग आउट',
        myCases: 'मेरी रिपोर्ट्स'
      },
      helpline: {
        banner: 'राष्ट्रीय साइबर धोखाधड़ी हेल्पलाइन: 1930',
        callBtn: '1930 पर कॉल करें',
        note: 'यदि वित्तीय नुकसान हुआ है तो तुरंत 1930 डायल करें। (क्लिक करने से डायलर खुलेगा; ऑटो-कॉल कभी नहीं होगी)'
      },
      submit: {
        title: 'संदिग्ध वित्तीय संदेश या धोखाधड़ी की रिपोर्ट करें',
        subtitle: 'संदिग्ध यूपीआई, बैंकिंग, केवाईसी, या कैशबैक धोखाधड़ी पैटर्न की तुरंत पारदर्शी जांच करें।',
        privacyWarning: 'गोपनीयता चेतावनी: कृपया कभी भी अपना ओटीपी (OTP), यूपीआई पिन (UPI PIN), या पासवर्ड दर्ज न करें।',
        evidenceType: 'संदेश का माध्यम',
        sender: 'भेजने वाले का नंबर या पहचान',
        senderPlaceholder: 'उदा. +91 98765 43210 या SMS हेडर',
        content: 'संदिग्ध संदेश या यूआरएल (मूल भाषा में)',
        contentPlaceholder: 'संदिग्ध संदेश को किसी भी भाषा में यहाँ पेस्ट करें (हिंदी, हिंग्लिश, बांग्ला, अंग्रेज़ी आदि)...',
        notes: 'अतिरिक्त विवरण (वैकल्पिक)',
        notesPlaceholder: 'कॉलर ने आपसे क्या करने को कहा...',
        consentLabel: 'मैं पुष्टि करता/करती हूँ कि यह साक्ष्य स्वेच्छा से विश्लेषण के लिए प्रस्तुत किया गया है और इसमें कोई गोपनीय क्रेडेंशियल नहीं है।',
        analyzeBtn: 'धोखाधड़ी पैटर्न का विश्लेषण करें',
        analyzingBtn: 'विश्लेषण जारी है...',
        multilingualTip: 'आप किसी भी भारतीय भाषा में साक्ष्य दे सकते हैं। मूल यूनिकोड टेक्स्ट को सुरक्षित रखा जाएगा।'
      },
      analysis: {
        title: 'पारदर्शी जोखिम मूल्यांकन',
        riskScore: 'जोखिम स्कोर',
        threatType: 'धोखाधड़ी का तरीका',
        uncertainty: 'अनिश्चितता स्तर',
        sourceLang: 'पहचानी गई भाषा',
        originalEvidence: 'मूल साक्ष्य (अपरिवर्तित यूनिकोड)',
        machineTranslation: 'मशीनी अनुवाद',
        viewOriginal: 'मूल टेक्स्ट',
        viewTranslation: 'अनुवाद',
        indicatorsTitle: 'पहचाने गए संदिग्ध संकेतक',
        actionsTitle: 'तत्काल अनुशंसित सुरक्षा उपाय',
        deleteCase: 'यह रिपोर्ट हमेशा के लिए हटाएं (गोपनीयता अधिकार)',
        deleteConfirm: 'क्या आप वाकई इस रिपोर्ट को स्थायी रूप से हटाना चाहते हैं?',
        shareReport: 'केस संदर्भ कॉपी करें'
      },
      roles: {
        user: 'उपयोगकर्ता',
        analyst: 'विश्लेषक',
        admin: 'व्यवस्थापक'
      }
    }
  },
  bn: {
    translation: {
      appName: 'স্ক্যামশিল্ড এআই',
      tagline: 'আর্থিক জালিয়াতি প্রতিরোধ ও প্রাথমিক সতর্কতা প্ল্যাটফর্ম',
      nav: {
        home: 'হোম',
        submit: 'প্রমাণ জমা দিন',
        history: 'কেস ইতিহাস',
        graph: 'প্রমাণ গ্রাফ',
        analyst: 'বিশ্লেষক পোর্টাল',
        admin: 'প্রশাসক',
        login: 'লগইন',
        logout: 'লগআউট',
        myCases: 'আমার রিপোর্ট'
      },
      helpline: {
        banner: 'জাতীয় সাইবার আর্থিক প্রতারণা হেল্পলাইন: 1930',
        callBtn: '1930 নম্বরে কল করুন',
        note: 'টাকা খোয়া গেলে অবিলম্বে ১৯৩০ নম্বরে কল করুন। (ক্লিক করলে ডায়ালার খুলবে)'
      },
      submit: {
        title: 'সন্দেহজনক আর্থিক প্রতারণার তথ্য জমা দিন',
        subtitle: 'ইউপিআই, ব্যাংকিং বা ভুয়ো পুরস্কারের প্রতারণা চক্র বিশ্লেষণ করুন।',
        privacyWarning: 'গোপনীয়তা সতর্কতা: কখনো ওটিপি (OTP), ইউপিআই পিন (UPI PIN) বা পাসওয়ার্ড শেয়ার করবেন না।',
        evidenceType: 'যোগাযোগের মাধ্যম',
        sender: 'প্রেরকের নম্বর বা উৎস',
        senderPlaceholder: 'যেমন: +91 98765 43210',
        content: 'সন্দেহজনক বার্তা বা লিংক',
        contentPlaceholder: 'যে কোনো ভাষায় মূল বার্তাটি এখানে পেস্ট করুন (বাংলা, হিন্দি, ইংরেজি ইত্যাদি)...',
        notes: 'অতিরিক্ত তথ্য (ঐচ্ছিক)',
        notesPlaceholder: 'ঘটনাক্রম বর্ণনা করুন...',
        consentLabel: 'আমি নিশ্চিত করছি যে এই প্রমাণটি স্বেচ্ছায় বিশ্লেষণের জন্য দেওয়া হয়েছে এবং এতে কোনো গোপনীয় পিন নেই।',
        analyzeBtn: 'প্রতারণা প্যাটার্ন বিশ্লেষণ করুন',
        analyzingBtn: 'বিশ্লেষণ চলছে...',
        multilingualTip: 'বাংলা বা যে কোনো ভারতীয় ভাষায় লিখুন। মূল ইউনিকোড অপরিবর্তিত থাকবে।'
      },
      analysis: {
        title: 'ব্যাখ্যাযোগ্য ঝুঁকি মূল্যায়ন',
        riskScore: 'ঝুঁকি স্কোর',
        threatType: 'প্রতারণার ধরন',
        uncertainty: 'অনিশ্চয়তার মাত্রা',
        sourceLang: 'চিহ্নিত ভাষা',
        originalEvidence: 'মূল প্রমাণ (অপরিবর্তিত ইউনিকোড)',
        machineTranslation: 'স্বয়ংক্রিয় অনুবাদ',
        viewOriginal: 'মূল রূপ',
        viewTranslation: 'অনুবাদ',
        indicatorsTitle: 'চিহ্নিত ঝুঁকিপূর্ণ সংকেত',
        actionsTitle: 'তাৎক্ষণিক নিরাপত্তামূলক পদক্ষেপ',
        deleteCase: 'এই রিপোর্টটি সম্পূর্ণ মুছে ফেলুন',
        deleteConfirm: 'আপনি কি নিশ্চিত যে এই রিপোর্টটি মুছে ফেলতে চান?',
        shareReport: 'কেস নম্বর কপি করুন'
      },
      roles: {
        user: 'ব্যবহারকারী',
        analyst: 'বিশ্লেষক',
        admin: 'প্রশাসক'
      }
    }
  }
};

const savedLang = localStorage.getItem('scamshield_ui_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
