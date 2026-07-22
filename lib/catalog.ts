export type Subcategory = {
  name: string;
  keywords: string[];
  categorySlugs?: string[];
};

export type Department = {
  name: string;
  slug: string;
  icon: string;
  tint: string;
  description: string;
  subcategories: Subcategory[];
};

export const departments: Department[] = [
  {
    name: "服装鞋包",
    slug: "fashion",
    icon: "👕",
    tint: "bg-rose-100 text-rose-700",
    description: "男装、女装、童装、内衣、鞋靴、箱包等",
    subcategories: ["男装", "女装", "童装", "内衣", "鞋靴", "箱包"].map((name) => ({ name, keywords: [name] })),
  },
  {
    name: "美妆个护",
    slug: "beauty",
    icon: "✨",
    tint: "bg-pink-100 text-pink-700",
    description: "护肤、彩妆、香水、个人护理用品等",
    subcategories: ["护肤", "彩妆", "香水", "个护"].map((name) => ({ name, keywords: [name] })),
  },
  {
    name: "数码家电",
    slug: "digital",
    icon: "📱",
    tint: "bg-blue-100 text-blue-700",
    description: "手机、电脑、平板、耳机、相机、冰箱、洗衣机等",
    subcategories: [
      { name: "手机", keywords: ["手机"] },
      { name: "电脑", keywords: ["电脑", "键盘"], categorySlugs: ["electronics"] },
      { name: "平板", keywords: ["平板"] },
      { name: "耳机", keywords: ["耳机", "音箱"] },
      { name: "相机", keywords: ["相机"] },
      { name: "家用电器", keywords: ["冰箱", "洗衣机", "电视", "空调"] },
    ],
  },
  {
    name: "家居生活",
    slug: "home-living",
    icon: "🏠",
    tint: "bg-orange-100 text-orange-700",
    description: "家具、家纺、厨具、卫浴、装饰、清洁用品等",
    subcategories: [
      { name: "家具", keywords: ["家具"] },
      { name: "家纺", keywords: ["家纺"] },
      { name: "厨具", keywords: ["厨具", "咖啡杯", "水壶"], categorySlugs: ["home-kitchen"] },
      { name: "卫浴", keywords: ["卫浴"] },
      { name: "家居装饰", keywords: ["装饰"] },
      { name: "清洁用品", keywords: ["清洁"] },
    ],
  },
  {
    name: "食品饮料",
    slug: "food",
    icon: "🍎",
    tint: "bg-emerald-100 text-emerald-700",
    description: "零食、酒水、冲调饮品、生鲜、水果等",
    subcategories: ["零食", "酒水", "冲调饮品", "生鲜", "水果"].map((name) => ({ name, keywords: [name] })),
  },
  {
    name: "母婴用品",
    slug: "baby",
    icon: "🧸",
    tint: "bg-cyan-100 text-cyan-700",
    description: "婴儿服饰、奶粉、玩具、安全座椅、孕产用品等",
    subcategories: ["婴儿服饰", "奶粉", "玩具", "安全座椅", "孕产用品"].map((name) => ({ name, keywords: [name] })),
  },
  {
    name: "运动户外",
    slug: "sports",
    icon: "🏃",
    tint: "bg-lime-100 text-lime-700",
    description: "运动鞋服、健身器材、旅行装备、户外用品等",
    subcategories: ["运动鞋服", "健身器材", "旅行装备", "户外用品"].map((name) => ({ name, keywords: [name] })),
  },
  {
    name: "图书音像",
    slug: "books-media",
    icon: "📚",
    tint: "bg-amber-100 text-amber-700",
    description: "书籍、杂志、文具、音像制品等",
    subcategories: [
      { name: "书籍", keywords: ["书", "之道"], categorySlugs: ["books"] },
      { name: "杂志", keywords: ["杂志"] },
      { name: "文具", keywords: ["文具"] },
      { name: "音像制品", keywords: ["音像", "唱片"] },
    ],
  },
  {
    name: "汽车用品",
    slug: "automotive",
    icon: "🚗",
    tint: "bg-slate-200 text-slate-700",
    description: "汽车装饰、维修工具、车载设备等",
    subcategories: ["汽车装饰", "维修工具", "车载设备"].map((name) => ({ name, keywords: [name] })),
  },
  {
    name: "珠宝首饰",
    slug: "jewelry",
    icon: "💎",
    tint: "bg-yellow-100 text-yellow-700",
    description: "金、银、钻石、宝石、玉石等饰品",
    subcategories: ["黄金", "银饰", "钻石", "宝石", "玉石"].map((name) => ({ name, keywords: [name] })),
  },
];

export function getDepartment(slug?: string) {
  return departments.find((department) => department.slug === slug);
}
