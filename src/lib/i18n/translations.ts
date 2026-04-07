export type Locale = "en" | "zh-TW";

export const translations = {
  en: {
    nav: {
      clubs: "Clubs",
      sessions: "My Sessions",
      venues: "Venues",
      profile: "Profile",
      signOut: "Sign out",
      signIn: "Sign In",
      findClubs: "Find Clubs",
    },
    home: {
      badge: "Premium Club Management",
      title_part1: "Master Your",
      title_part2: "Court Time.",
      description: "The elegant way to manage sessions, track player ELO, and organize your pickleball community. Built for clubs that value the game.",
      exploreClubs: "Explore Clubs",
      leaderLogin: "Club Leader Login",
    },
    common: {
      language: "Language",
      en: "EN",
      zh: "繁中",
    },
  },
  "zh-TW": {
    nav: {
      clubs: "球館/社團",
      sessions: "我的場次",
      venues: "場地指南",
      profile: "個人主頁",
      signOut: "登出",
      signIn: "登入",
      findClubs: "尋找社團",
    },
    home: {
      badge: "頂級俱樂部管理系統",
      title_part1: "掌握您的",
      title_part2: "場地時光",
      description: "用優雅的方式管理場次、追蹤球員積分，並組織您的匹克球社群。專為重視運動品質的俱樂部打造。",
      exploreClubs: "探索社團",
      leaderLogin: "會長/隊長登入",
    },
    common: {
      language: "語言",
      en: "EN",
      zh: "繁中",
    },
  },
};

export type TranslationKeys = typeof translations.en;
