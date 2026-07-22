import { PrismaClient } from "@prisma/client";
import { departments } from "../lib/catalog";

const prisma = new PrismaClient();

const productNames: Record<string, string> = {
  "男装": "男士精梳纯棉牛津纺衬衫",
  "女装": "女士法式收腰碎花连衣裙",
  "童装": "儿童舒适纯棉圆领卫衣",
  "内衣": "无痕高弹舒适内衣套装",
  "鞋靴": "轻量透气休闲运动鞋",
  "箱包": "大容量通勤手提托特包",
  "护肤": "温和保湿修护精华液",
  "彩妆": "持久显色丝绒哑光唇釉",
  "香水": "清新木质调持久淡香水",
  "个护": "声波深层清洁电动牙刷",
  "手机": "轻薄影像智能手机 256GB",
  "电脑": "14 英寸高性能轻薄笔记本电脑",
  "平板": "11 英寸护眼学习平板电脑",
  "耳机": "主动降噪真无线蓝牙耳机",
  "相机": "复古微单数码相机套机",
  "家用电器": "智能变频节能空调 1.5 匹",
  "家具": "北欧简约实木休闲单人椅",
  "家纺": "A 类纯棉柔软四件套",
  "厨具": "麦饭石不粘锅厨具三件套",
  "卫浴": "空气增压节水淋浴花洒",
  "家居装饰": "现代简约抽象客厅装饰画",
  "清洁用品": "多效去污清洁用品礼盒",
  "零食": "每日坚果混合零食礼盒",
  "酒水": "精酿小麦白啤酒六瓶装",
  "冲调饮品": "阿拉比卡挂耳冲调咖啡",
  "生鲜": "鲜切谷饲原切牛排套装",
  "水果": "产地直发时令水果礼盒",
  "婴儿服饰": "A 类纯棉婴儿连体服套装",
  "奶粉": "婴幼儿配方奶粉 800g",
  "玩具": "儿童磁力片益智拼搭玩具",
  "安全座椅": "儿童汽车 360° 旋转安全座椅",
  "孕产用品": "孕产妇待产护理用品包",
  "运动鞋服": "速干透气运动鞋服套装",
  "健身器材": "家用可调节哑铃健身器材",
  "旅行装备": "轻量便携折叠旅行装备套装",
  "户外用品": "防水防晒自动户外帐篷",
  "书籍": "人类简史精装版书籍",
  "杂志": "国家地理中文版杂志年度合订",
  "文具": "高颜值学习办公文具礼盒",
  "音像制品": "经典古典音乐黑胶音像制品",
  "汽车装饰": "汽车内饰装饰件实用套装",
  "维修工具": "108 件套车载家用维修工具箱",
  "车载设备": "4K 高清夜视车载记录设备",
  "黄金": "3D 硬金足金黄金转运珠手链",
  "银饰": "S925 纯银饰品星月项链",
  "钻石": "18K 金经典六爪钻石戒指",
  "宝石": "彩色天然宝石轻奢耳饰",
  "玉石": "温润天然和田玉石吊坠",
};

const imageSearches: Record<string, string> = {
  "男装": "mens,clothing", "女装": "womens,dress", "童装": "kids,clothing",
  "内衣": "lingerie,clothing", "鞋靴": "fashion,shoes", "箱包": "fashion,handbag",
  "护肤": "skincare,cosmetics", "彩妆": "makeup,cosmetics", "香水": "perfume,bottle",
  "个护": "electric,toothbrush", "手机": "smartphone,technology", "电脑": "laptop,computer",
  "平板": "tablet,computer", "耳机": "headphones", "相机": "digital,camera",
  "家用电器": "home,appliance", "家具": "modern,furniture", "家纺": "bedding,home",
  "厨具": "cookware,kitchen", "卫浴": "bathroom,shower", "家居装饰": "home,decor",
  "清洁用品": "cleaning,supplies", "零食": "snacks,food", "酒水": "beer,drinks",
  "冲调饮品": "coffee,drink", "生鲜": "fresh,steak", "水果": "fresh,fruit",
  "婴儿服饰": "baby,clothes", "奶粉": "baby,milk", "玩具": "children,toys",
  "安全座椅": "child,carseat", "孕产用品": "maternity,baby", "运动鞋服": "sportswear,running",
  "健身器材": "fitness,dumbbell", "旅行装备": "travel,gear", "户外用品": "camping,tent",
  "书籍": "books,reading", "杂志": "magazine,reading", "文具": "stationery,desk",
  "音像制品": "vinyl,record", "汽车装饰": "car,interior", "维修工具": "mechanic,tools",
  "车载设备": "car,dashcam", "黄金": "gold,jewelry", "银饰": "silver,jewelry",
  "钻石": "diamond,ring", "宝石": "gemstone,jewelry", "玉石": "jade,jewelry",
};

async function main() {
  let count = 0;
  const styles = [
    "经典款", "轻奢款", "简约款", "时尚款", "升级款",
    "新锐款", "舒适款", "旗舰款", "青春款", "优选款",
  ];
  const editions = ["晴空", "暮色", "森林", "海岸", "星河"];

  for (const department of departments) {
    for (const [index, subcategory] of department.subcategories.entries()) {
      const categorySlug = `catalog-${department.slug}-${index + 1}`;
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: { name: subcategory.name },
        create: { name: subcategory.name, slug: categorySlug },
      });
      const baseName = productNames[subcategory.name] ?? `${subcategory.name}精选商品`;
      const imageQuery = imageSearches[subcategory.name] ?? "shopping,product";

      for (let variant = 0; variant < 50; variant += 1) {
        const number = String(variant + 1).padStart(2, "0");
        const productSlug = `${categorySlug}-${number}`;
        const name = `${baseName} ${styles[variant % styles.length]}${editions[Math.floor(variant / 10)]}`;
        const imageLock = count * 100 + variant + 1001;
        const imageUrl = `https://loremflickr.com/640/640/${imageQuery}?lock=${imageLock}`;
        const data = {
          name,
          description: `${department.name}·${subcategory.name}精选第 ${variant + 1} 款，兼顾实用性、品质与日常使用体验。`,
          price: 1999 + ((count * 17 + variant * 13) % 180) * 100,
          stock: 12 + ((count + variant) % 18) * 4,
          categoryId: category.id,
          imageUrl,
        };

        await prisma.product.upsert({
          where: { slug: productSlug },
          update: data,
          create: { ...data, slug: productSlug },
        });
      }
      count += 1;
    }
  }

  console.log(`已导入 ${count * 50} 件目录商品（${count} 个二级分类，每类 50 件）。`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
