"use client";

import {
  Check,
  Coins,
  MegaphoneOff,
  PackageCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Undo2,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { FINANCIAL_AMOUNT_MAX } from "@/lib/financial-score";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { parseShoppingAmountCents, parseShoppingPriceCents, shoppingTotalCents } from "@/lib/shopping-amounts";
import { cn, formatCurrency } from "@/lib/utils";

type Trigger = "ad" | "sale" | "stress" | "boredom" | "social" | "need";
type DecisionKey = "return" | "sell" | "pause" | "keep";

type ShoppingCopy = {
  eyebrow: string;
  title: string;
  description: string;
  readText: string;
  purchaseTitle: string;
  purchaseDescription: string;
  itemName: string;
  itemPlaceholder: string;
  price: string;
  daysSincePurchase: string;
  returnWindow: string;
  usedTimes: string;
  needLevel: string;
  regretLevel: string;
  trigger: string;
  receipt: string;
  triggers: Record<Trigger, string>;
  low: string;
  high: string;
  decisionTitle: string;
  impulseScore: string;
  returnStatus: string;
  returnOpen: string;
  returnClosed: string;
  recoverableCash: string;
  voiceLabel: string;
  decisions: Record<DecisionKey, { title: string; description: string; voice: string }>;
  unusedTitle: string;
  unusedDescription: string;
  unusedName: string;
  unusedValue: string;
  addItem: string;
  emptyItems: string;
  sellableTotal: string;
  remove: string;
  tipsTitle: string;
  tips: string[];
  adTitle: string;
  adCopy: string;
  disclaimer: string;
};

type UnusedItem = {
  id: number;
  name: string;
  valueCents: number;
};

const EN_SHOPPING_COPY: ShoppingCopy = {
    eyebrow: "Shopping hygiene",
    title: "Stop impulse spending before it becomes your habit.",
    description:
      "Analyze buyer's remorse, returns and unused things. Coach FI helps you recover cash and protect attention from advertising pressure.",
    readText:
      "Shopping hygiene. Analyze a purchase, decide whether to return it, sell unused things and build a calmer buying habit.",
    purchaseTitle: "Purchase analysis",
    purchaseDescription: "Use this after a purchase or before the next impulse buy.",
    itemName: "What did you buy?",
    itemPlaceholder: "Headphones, shoes, gadget...",
    price: "Price",
    daysSincePurchase: "Days since purchase",
    returnWindow: "Return window in days",
    usedTimes: "How many times have you used it?",
    needLevel: "Real need",
    regretLevel: "Buyer's remorse",
    trigger: "What triggered the purchase?",
    receipt: "I still have the receipt or order confirmation",
    triggers: {
      ad: "Ad or influencer",
      sale: "Sale or discount",
      stress: "Stress",
      boredom: "Boredom",
      social: "Social pressure",
      need: "Real planned need",
    },
    low: "Low",
    high: "High",
    decisionTitle: "Coach decision",
    impulseScore: "Impulse score",
    returnStatus: "Return status",
    returnOpen: "Return may still be possible",
    returnClosed: "Return is probably closed",
    recoverableCash: "Potential cash to recover",
    voiceLabel: "Read Coach decision",
    decisions: {
      return: {
        title: "Return it if the policy allows it",
        description:
          "You regret the purchase, the need is low and the return window may still be open. Check the store policy today.",
        voice:
          "The best next step is to return this item if the store policy allows it. You regret the purchase, the need is low and the return window may still be open. Recover the cash and move it to savings.",
      },
      sell: {
        title: "Sell it and turn clutter into cash",
        description:
          "If you cannot return it but you do not use it, list it for sale. Set a fair price and a seven day deadline.",
        voice:
          "The best next step is to sell this item. If you cannot return it and you do not use it, turn clutter into cash. Set a fair price and a seven day deadline.",
      },
      pause: {
        title: "Pause before deciding",
        description: "The signal looks impulsive. Wait 24 hours, remove ad triggers and decide with a calmer head.",
        voice:
          "The best next step is to pause. The purchase looks impulsive. Wait twenty four hours, remove ad triggers and decide with a calmer head.",
      },
      keep: {
        title: "Keep it, but use it intentionally",
        description:
          "This looks closer to a real need. Keep it only if it replaces something, solves a problem or is used regularly.",
        voice:
          "This purchase looks closer to a real need. Keep it only if it replaces something, solves a real problem or is used regularly.",
      },
    },
    unusedTitle: "Unused things audit",
    unusedDescription: "Add things around you that you do not use. The total becomes your recovery target.",
    unusedName: "Unused thing",
    unusedValue: "Estimated sale value",
    addItem: "Add item",
    emptyItems: "Start with one drawer, one shelf or one box. Add the first unused thing.",
    sellableTotal: "Possible cash from unused things",
    remove: "Remove",
    tipsTitle: "Shopping hygiene rules",
    tips: [
      "Use a 24-hour pause for non-essential purchases.",
      "Unsubscribe from stores that trigger impulse buys.",
      "Keep a wish list instead of a checkout basket.",
      "Use the one-in, one-out rule for clothes and gadgets.",
      "Move recovered cash to savings before it disappears again.",
    ],
    adTitle: "Advertising reset",
    adCopy:
      "If ads make you feel behind, poorer or incomplete, that is a signal to mute, unfollow or block the trigger. Your attention is also a financial asset.",
    disclaimer:
      "Educational tool only. Return rights depend on country, store policy and product condition. Always check the seller's terms.",
};

const SHOPPING_COPY: LocalizedMap<ShoppingCopy> = {
  en: EN_SHOPPING_COPY,
  pl: {
    eyebrow: "Higiena zakupowa",
    title: "Zatrzymaj impulsywne zakupy, zanim staną się nawykiem.",
    description:
      "Przeanalizuj kaca zakupowego, zwroty i nieużywane rzeczy. Coach FI pomaga odzyskać gotówkę i ochronić uwagę przed presją reklam.",
    readText:
      "Higiena zakupowa. Przeanalizuj zakup, zdecyduj czy go zwrócić, sprzedaj nieużywane rzeczy i zbuduj spokojniejszy nawyk kupowania.",
    purchaseTitle: "Analiza zakupu",
    purchaseDescription: "Użyj po zakupie albo przed kolejną impulsywną decyzją.",
    itemName: "Co kupiłeś?",
    itemPlaceholder: "Słuchawki, buty, gadżet...",
    price: "Cena",
    daysSincePurchase: "Dni od zakupu",
    returnWindow: "Okno zwrotu w dniach",
    usedTimes: "Ile razy użyte?",
    needLevel: "Realna potrzeba",
    regretLevel: "Kac zakupowy",
    trigger: "Co wywołało zakup?",
    receipt: "Mam paragon albo potwierdzenie zamówienia",
    triggers: {
      ad: "Reklama lub influencer",
      sale: "Promocja lub rabat",
      stress: "Stres",
      boredom: "Nuda",
      social: "Presja otoczenia",
      need: "Realna zaplanowana potrzeba",
    },
    low: "Nisko",
    high: "Wysoko",
    decisionTitle: "Decyzja coacha",
    impulseScore: "Wynik impulsu",
    returnStatus: "Status zwrotu",
    returnOpen: "Zwrot może być jeszcze możliwy",
    returnClosed: "Zwrot prawdopodobnie zamknięty",
    recoverableCash: "Potencjalna gotówka do odzyskania",
    voiceLabel: "Odczytaj decyzję coacha",
    decisions: {
      return: {
        title: "Zwróć, jeśli regulamin na to pozwala",
        description:
          "Żałujesz zakupu, potrzeba jest niska, a okno zwrotu może być nadal otwarte. Sprawdź regulamin sklepu dzisiaj.",
        voice:
          "Najlepszy następny krok to zwrócić ten produkt, jeśli regulamin sklepu na to pozwala. Żałujesz zakupu, potrzeba jest niska, a okno zwrotu może być nadal otwarte. Odzyskaj gotówkę i przenieś ją do oszczędności.",
      },
      sell: {
        title: "Sprzedaj i zamień bałagan na gotówkę",
        description:
          "Jeśli nie możesz zwrócić produktu, ale go nie używasz, wystaw go na sprzedaż. Ustal uczciwą cenę i termin siedmiu dni.",
        voice:
          "Najlepszy następny krok to sprzedać ten przedmiot. Jeśli nie możesz go zwrócić i go nie używasz, zamień bałagan na gotówkę. Ustal uczciwą cenę i termin siedmiu dni.",
      },
      pause: {
        title: "Odczekaj przed decyzją",
        description: "Sygnał wygląda impulsywnie. Odczekaj 24 godziny, usuń bodźce reklamowe i zdecyduj spokojniej.",
        voice:
          "Najlepszy następny krok to pauza. Ten zakup wygląda impulsywnie. Odczekaj dwadzieścia cztery godziny, usuń bodźce reklamowe i zdecyduj spokojniej.",
      },
      keep: {
        title: "Zostaw, ale używaj świadomie",
        description:
          "To wygląda bliżej realnej potrzeby. Zostaw tylko wtedy, gdy rzecz coś zastępuje, rozwiązuje problem albo jest regularnie używana.",
        voice:
          "Ten zakup wygląda bliżej realnej potrzeby. Zostaw go tylko wtedy, gdy coś zastępuje, rozwiązuje realny problem albo jest regularnie używany.",
      },
    },
    unusedTitle: "Audyt nieużywanych rzeczy",
    unusedDescription: "Dodaj rzeczy wokół siebie, których nie używasz. Suma staje się celem odzyskanej gotówki.",
    unusedName: "Nieużywana rzecz",
    unusedValue: "Szacowana wartość sprzedaży",
    addItem: "Dodaj rzecz",
    emptyItems: "Zacznij od jednej szuflady, półki albo pudełka. Dodaj pierwszą nieużywaną rzecz.",
    sellableTotal: "Możliwa gotówka z nieużywanych rzeczy",
    remove: "Usuń",
    tipsTitle: "Zasady higieny zakupowej",
    tips: [
      "Stosuj pauzę 24 godziny przy zakupach niekoniecznych.",
      "Wypisz się ze sklepów, które wywołują impulsywne zakupy.",
      "Trzymaj listę życzeń zamiast koszyka zakupowego.",
      "Używaj zasady jedna rzecz wchodzi, jedna wychodzi przy ubraniach i gadżetach.",
      "Przenieś odzyskaną gotówkę do oszczędności, zanim znowu się rozejdzie.",
    ],
    adTitle: "Reset reklamowy",
    adCopy:
      "Jeśli reklamy sprawiają, że czujesz brak, presję albo porównywanie się z innymi, wycisz, odfollowuj albo zablokuj bodziec. Twoja uwaga też jest aktywem finansowym.",
    disclaimer:
      "To narzędzie edukacyjne. Prawo zwrotu zależy od kraju, regulaminu sklepu i stanu produktu. Zawsze sprawdź warunki sprzedawcy.",
  },
  es: {
    eyebrow: "Higiene de compras",
    title: "Frena el gasto impulsivo antes de que se convierta en hábito.",
    description:
      "Analiza el arrepentimiento de compra, las devoluciones y las cosas que no usas. Coach FI te ayuda a recuperar dinero y a proteger tu atención de la presión publicitaria.",
    readText:
      "Higiene de compras. Analiza una compra, decide si devolverla, vende lo que no usas y construye un hábito de compra más tranquilo.",
    purchaseTitle: "Análisis de la compra",
    purchaseDescription: "Úsalo después de una compra o antes de la próxima compra impulsiva.",
    itemName: "¿Qué compraste?",
    itemPlaceholder: "Auriculares, zapatos, un gadget...",
    price: "Precio",
    daysSincePurchase: "Días desde la compra",
    returnWindow: "Plazo de devolución en días",
    usedTimes: "¿Cuántas veces lo has usado?",
    needLevel: "Necesidad real",
    regretLevel: "Arrepentimiento",
    trigger: "¿Qué desencadenó la compra?",
    receipt: "Aún conservo el ticket o la confirmación del pedido",
    triggers: {
      ad: "Anuncio o influencer",
      sale: "Rebaja o descuento",
      stress: "Estrés",
      boredom: "Aburrimiento",
      social: "Presión social",
      need: "Necesidad real y planificada",
    },
    low: "Bajo",
    high: "Alto",
    decisionTitle: "Decisión del coach",
    impulseScore: "Puntuación de impulso",
    returnStatus: "Estado de la devolución",
    returnOpen: "La devolución aún puede ser posible",
    returnClosed: "La devolución probablemente ya no es posible",
    recoverableCash: "Dinero que podrías recuperar",
    voiceLabel: "Leer la decisión del coach",
    decisions: {
      return: {
        title: "Devuélvelo si la política lo permite",
        description:
          "Te arrepientes de la compra, la necesidad es baja y el plazo de devolución puede seguir abierto. Revisa hoy la política de la tienda.",
        voice:
          "El mejor siguiente paso es devolver este artículo si la política de la tienda lo permite. Te arrepientes de la compra, la necesidad es baja y el plazo de devolución puede seguir abierto. Recupera el dinero y pásalo al ahorro.",
      },
      sell: {
        title: "Véndelo y convierte el desorden en dinero",
        description:
          "Si no puedes devolverlo pero no lo usas, ponlo a la venta. Fija un precio justo y un plazo de siete días.",
        voice:
          "El mejor siguiente paso es vender este artículo. Si no puedes devolverlo y no lo usas, convierte el desorden en dinero. Fija un precio justo y un plazo de siete días.",
      },
      pause: {
        title: "Haz una pausa antes de decidir",
        description: "La señal parece impulsiva. Espera 24 horas, elimina los disparadores publicitarios y decide con la cabeza más fría.",
        voice:
          "El mejor siguiente paso es hacer una pausa. La compra parece impulsiva. Espera veinticuatro horas, elimina los disparadores publicitarios y decide con la cabeza más fría.",
      },
      keep: {
        title: "Quédatelo, pero úsalo con intención",
        description:
          "Esto se parece más a una necesidad real. Quédatelo solo si sustituye algo, resuelve un problema o lo usas con regularidad.",
        voice:
          "Esta compra se parece más a una necesidad real. Quédatela solo si sustituye algo, resuelve un problema real o la usas con regularidad.",
      },
    },
    unusedTitle: "Auditoría de cosas sin usar",
    unusedDescription: "Añade las cosas que tienes cerca y no usas. El total será tu objetivo de recuperación.",
    unusedName: "Cosa sin usar",
    unusedValue: "Valor de venta estimado",
    addItem: "Añadir",
    emptyItems: "Empieza por un cajón, una estantería o una caja. Añade la primera cosa que no usas.",
    sellableTotal: "Dinero posible con cosas sin usar",
    remove: "Quitar",
    tipsTitle: "Reglas de higiene de compras",
    tips: [
      "Haz una pausa de 24 horas en las compras no esenciales.",
      "Date de baja de las tiendas que te provocan compras impulsivas.",
      "Lleva una lista de deseos en lugar de una cesta de compra.",
      "Aplica la regla de «entra uno, sale uno» con la ropa y los gadgets.",
      "Pasa el dinero recuperado al ahorro antes de que vuelva a desaparecer.",
    ],
    adTitle: "Reinicio publicitario",
    adCopy:
      "Si los anuncios te hacen sentir rezagado, más pobre o incompleto, es una señal para silenciar, dejar de seguir o bloquear ese disparador. Tu atención también es un activo financiero.",
    disclaimer:
      "Herramienta únicamente educativa. Los derechos de devolución dependen del país, de la política de la tienda y del estado del producto. Consulta siempre las condiciones del vendedor.",
},
  fr: {
    eyebrow: "Hygiène d'achat",
    title: "Stoppez les achats impulsifs avant qu'ils ne deviennent une habitude.",
    description:
      "Analysez les regrets d'achat, les retours et les objets inutilisés. Coach FI vous aide à récupérer de l'argent et à protéger votre attention de la pression publicitaire.",
    readText:
      "Hygiène d'achat. Analysez un achat, décidez de le retourner ou non, vendez les objets inutilisés et construisez une habitude d'achat plus sereine.",
    purchaseTitle: "Analyse de l'achat",
    purchaseDescription: "À utiliser après un achat ou avant le prochain achat impulsif.",
    itemName: "Qu'avez-vous acheté ?",
    itemPlaceholder: "Casque, chaussures, gadget...",
    price: "Prix",
    daysSincePurchase: "Jours depuis l'achat",
    returnWindow: "Délai de retour en jours",
    usedTimes: "Combien de fois l'avez-vous utilisé ?",
    needLevel: "Besoin réel",
    regretLevel: "Regret d'achat",
    trigger: "Qu'est-ce qui a déclenché l'achat ?",
    receipt: "J'ai encore le ticket ou la confirmation de commande",
    triggers: {
      ad: "Publicité ou influenceur",
      sale: "Soldes ou promotion",
      stress: "Stress",
      boredom: "Ennui",
      social: "Pression sociale",
      need: "Besoin réel et prévu",
    },
    low: "Faible",
    high: "Élevé",
    decisionTitle: "Décision du coach",
    impulseScore: "Score d'impulsivité",
    returnStatus: "Statut du retour",
    returnOpen: "Le retour est peut-être encore possible",
    returnClosed: "Le retour n'est probablement plus possible",
    recoverableCash: "Argent potentiellement récupérable",
    voiceLabel: "Lire la décision du coach",
    decisions: {
      return: {
        title: "Retournez-le si la politique le permet",
        description:
          "Vous regrettez l'achat, le besoin est faible et le délai de retour est peut-être encore ouvert. Vérifiez la politique du magasin dès aujourd'hui.",
        voice:
          "La meilleure prochaine étape est de retourner cet article si la politique du magasin le permet. Vous regrettez l'achat, le besoin est faible et le délai de retour est peut-être encore ouvert. Récupérez l'argent et placez-le en épargne.",
      },
      sell: {
        title: "Vendez-le et transformez l'encombrement en argent",
        description:
          "Si vous ne pouvez pas le retourner mais ne l'utilisez pas, mettez-le en vente. Fixez un prix juste et une échéance de sept jours.",
        voice:
          "La meilleure prochaine étape est de vendre cet article. Si vous ne pouvez pas le retourner et ne l'utilisez pas, transformez l'encombrement en argent. Fixez un prix juste et une échéance de sept jours.",
      },
      pause: {
        title: "Faites une pause avant de décider",
        description: "Le signal semble impulsif. Attendez 24 heures, supprimez les déclencheurs publicitaires et décidez à tête reposée.",
        voice:
          "La meilleure prochaine étape est de faire une pause. L'achat semble impulsif. Attendez vingt-quatre heures, supprimez les déclencheurs publicitaires et décidez à tête reposée.",
      },
      keep: {
        title: "Gardez-le, mais utilisez-le en conscience",
        description:
          "Cela ressemble davantage à un vrai besoin. Gardez-le seulement s'il remplace quelque chose, résout un problème ou sert régulièrement.",
        voice:
          "Cet achat ressemble davantage à un vrai besoin. Gardez-le seulement s'il remplace quelque chose, résout un vrai problème ou sert régulièrement.",
      },
    },
    unusedTitle: "Audit des objets inutilisés",
    unusedDescription: "Ajoutez les objets autour de vous que vous n'utilisez pas. Le total devient votre objectif de récupération.",
    unusedName: "Objet inutilisé",
    unusedValue: "Valeur de revente estimée",
    addItem: "Ajouter",
    emptyItems: "Commencez par un tiroir, une étagère ou un carton. Ajoutez le premier objet inutilisé.",
    sellableTotal: "Argent possible avec les objets inutilisés",
    remove: "Retirer",
    tipsTitle: "Règles d'hygiène d'achat",
    tips: [
      "Faites une pause de 24 heures pour les achats non essentiels.",
      "Désabonnez-vous des boutiques qui déclenchent vos achats impulsifs.",
      "Tenez une liste d'envies plutôt qu'un panier.",
      "Appliquez la règle « un qui entre, un qui sort » pour les vêtements et les gadgets.",
      "Placez l'argent récupéré en épargne avant qu'il ne disparaisse à nouveau.",
    ],
    adTitle: "Remise à zéro publicitaire",
    adCopy:
      "Si les publicités vous donnent le sentiment d'être en retard, plus pauvre ou incomplet, c'est le signal qu'il faut masquer, ne plus suivre ou bloquer ce déclencheur. Votre attention est aussi un actif financier.",
    disclaimer:
      "Outil uniquement éducatif. Les droits de retour dépendent du pays, de la politique du magasin et de l'état du produit. Vérifiez toujours les conditions du vendeur.",
},
  zh: {
    eyebrow: "购物卫生",
    title: "在冲动消费变成习惯之前停下来。",
    description:
      "分析购物后的后悔、退货和闲置物品。Coach FI 帮你拿回现金，并保护你的注意力不被广告左右。",
    readText:
      "购物卫生。分析一次购买，决定是否退货，卖掉闲置物品，养成更从容的购物习惯。",
    purchaseTitle: "购买分析",
    purchaseDescription: "在购买之后或下一次冲动消费之前使用。",
    itemName: "你买了什么？",
    itemPlaceholder: "耳机、鞋子、小玩意儿……",
    price: "价格",
    daysSincePurchase: "购买后的天数",
    returnWindow: "可退货天数",
    usedTimes: "你用过几次？",
    needLevel: "真实需要",
    regretLevel: "购物后悔程度",
    trigger: "是什么促使你购买？",
    receipt: "我还留着小票或订单确认",
    triggers: {
      ad: "广告或网红",
      sale: "促销或折扣",
      stress: "压力",
      boredom: "无聊",
      social: "社交压力",
      need: "真实且有计划的需要",
    },
    low: "低",
    high: "高",
    decisionTitle: "教练的建议",
    impulseScore: "冲动指数",
    returnStatus: "退货状态",
    returnOpen: "可能还可以退货",
    returnClosed: "很可能已不能退货",
    recoverableCash: "可能拿回的现金",
    voiceLabel: "朗读教练的建议",
    decisions: {
      return: {
        title: "如果政策允许，就退货",
        description:
          "你后悔这次购买，需要程度低，而且退货期可能还没结束。今天就查看商家的政策。",
        voice:
          "下一步最好是在商家政策允许的情况下退掉这件商品。你后悔这次购买，需要程度低，而且退货期可能还没结束。把钱拿回来，转入储蓄。",
      },
      sell: {
        title: "卖掉它，把杂物变成现金",
        description:
          "如果不能退货又用不上，就把它挂出去卖。定一个合理的价格和七天的期限。",
        voice:
          "下一步最好是卖掉这件商品。如果不能退货又用不上，就把杂物变成现金。定一个合理的价格和七天的期限。",
      },
      pause: {
        title: "先停一停再决定",
        description: "这看起来是冲动消费。等 24 小时，移除广告诱因，冷静下来再决定。",
        voice:
          "下一步最好是先停一停。这次购买看起来是冲动消费。等二十四小时，移除广告诱因，冷静下来再决定。",
      },
      keep: {
        title: "留下它，但要有意识地使用",
        description:
          "这更接近真实的需要。只有当它替代了某样东西、解决了问题或会经常使用时才留下。",
        voice:
          "这次购买更接近真实的需要。只有当它替代了某样东西、解决了实际问题或会经常使用时才留下。",
      },
    },
    unusedTitle: "闲置物品盘点",
    unusedDescription: "添加你身边用不上的东西。总额就是你的回收目标。",
    unusedName: "闲置物品",
    unusedValue: "预计可卖价格",
    addItem: "添加",
    emptyItems: "从一个抽屉、一层架子或一个箱子开始。添加第一件闲置物品。",
    sellableTotal: "闲置物品可能换回的现金",
    remove: "移除",
    tipsTitle: "购物卫生守则",
    tips: [
      "非必需的购买先等 24 小时。",
      "退订那些诱发你冲动消费的商家。",
      "用愿望清单代替购物车。",
      "衣服和电子产品遵循“进一件，出一件”的原则。",
      "把拿回的现金先转入储蓄，别让它再次消失。",
    ],
    adTitle: "广告重置",
    adCopy:
      "如果广告让你觉得自己落后、更穷或不完整，那就是该静音、取关或屏蔽这个诱因的信号。你的注意力也是一种财务资产。",
    disclaimer:
      "仅为教育工具。退货权利取决于国家、商家政策和商品状况。请务必查看卖家的条款。",
},
  ja: {
    eyebrow: "買い物の衛生習慣",
    title: "衝動買いが習慣になる前に止めましょう。",
    description:
      "買ったあとの後悔、返品、使っていないものを見直します。Coach FIは、お金を取り戻し、広告の圧力から注意力を守るお手伝いをします。",
    readText:
      "買い物の衛生習慣。購入を見直し、返品するかを決め、使っていないものを売り、落ち着いた買い方の習慣を作りましょう。",
    purchaseTitle: "購入の分析",
    purchaseDescription: "購入のあと、または次の衝動買いの前に使ってください。",
    itemName: "何を買いましたか？",
    itemPlaceholder: "ヘッドホン、靴、ガジェットなど",
    price: "価格",
    daysSincePurchase: "購入からの日数",
    returnWindow: "返品できる日数",
    usedTimes: "何回使いましたか？",
    needLevel: "本当の必要度",
    regretLevel: "買ったことへの後悔",
    trigger: "購入のきっかけは？",
    receipt: "レシートまたは注文確認がまだ手元にある",
    triggers: {
      ad: "広告やインフルエンサー",
      sale: "セールや割引",
      stress: "ストレス",
      boredom: "退屈",
      social: "まわりからの圧力",
      need: "計画していた本当の必要",
    },
    low: "低い",
    high: "高い",
    decisionTitle: "コーチの判断",
    impulseScore: "衝動スコア",
    returnStatus: "返品の状況",
    returnOpen: "まだ返品できるかもしれません",
    returnClosed: "返品はおそらくできません",
    recoverableCash: "取り戻せる可能性のある金額",
    voiceLabel: "コーチの判断を読み上げる",
    decisions: {
      return: {
        title: "規約が許せば返品しましょう",
        description:
          "購入を後悔していて、必要度は低く、返品期間がまだ残っているかもしれません。今日のうちにお店の規約を確認しましょう。",
        voice:
          "次の一歩は、お店の規約が許すならこの商品を返品することです。購入を後悔していて、必要度は低く、返品期間がまだ残っているかもしれません。お金を取り戻して貯蓄に回しましょう。",
      },
      sell: {
        title: "売って、不用品を現金に変えましょう",
        description:
          "返品できず、使ってもいないなら、出品しましょう。適正な価格と7日間の期限を決めます。",
        voice:
          "次の一歩は、この商品を売ることです。返品できず、使ってもいないなら、不用品を現金に変えましょう。適正な価格と7日間の期限を決めます。",
      },
      pause: {
        title: "決める前にひと呼吸",
        description: "衝動的な買い物のサインが出ています。24時間待ち、広告のきっかけを取り除いて、落ち着いてから決めましょう。",
        voice:
          "次の一歩は、ひと呼吸おくことです。この購入は衝動的に見えます。24時間待ち、広告のきっかけを取り除いて、落ち着いてから決めましょう。",
      },
      keep: {
        title: "手元に残して、意識して使いましょう",
        description:
          "これは本当の必要に近いようです。何かの代わりになる、問題を解決する、定期的に使う、という場合だけ残しましょう。",
        voice:
          "この購入は本当の必要に近いようです。何かの代わりになる、実際の問題を解決する、定期的に使う、という場合だけ残しましょう。",
      },
    },
    unusedTitle: "使っていないものの棚卸し",
    unusedDescription: "身のまわりの使っていないものを追加してください。合計が取り戻す目標額になります。",
    unusedName: "使っていないもの",
    unusedValue: "売れそうな金額の目安",
    addItem: "追加",
    emptyItems: "引き出し1つ、棚1段、箱1つから始めましょう。最初の使っていないものを追加してください。",
    sellableTotal: "使っていないものから得られそうな金額",
    remove: "削除",
    tipsTitle: "買い物の衛生習慣のルール",
    tips: [
      "必需品以外の買い物は24時間待つ。",
      "衝動買いのきっかけになるお店の配信を解除する。",
      "買い物かごの代わりに、ほしいものリストを作る。",
      "服やガジェットは「1つ買ったら1つ手放す」。",
      "取り戻したお金は、また消えてしまう前に貯蓄へ。",
    ],
    adTitle: "広告リセット",
    adCopy:
      "広告を見て、遅れている、貧しい、足りないと感じるなら、そのきっかけをミュート、フォロー解除、ブロックする合図です。あなたの注意力も大切な資産です。",
    disclaimer:
      "学習用のツールです。返品の権利は国、お店の規約、商品の状態によって異なります。必ず販売者の条件を確認してください。",
},
  hi: {
    eyebrow: "खरीदारी की समझ",
    title: "आवेग में खर्च को आदत बनने से पहले रोकें।",
    description:
      "खरीद के बाद के पछतावे, वापसी और बेकार पड़ी चीज़ों का विश्लेषण करें। Coach FI आपको नकदी वापस पाने और विज्ञापनों के दबाव से अपना ध्यान बचाने में मदद करता है।",
    readText:
      "खरीदारी की समझ। किसी खरीद का विश्लेषण करें, तय करें कि उसे लौटाना है या नहीं, बेकार पड़ी चीज़ें बेचें और खरीदने की शांत आदत बनाएं।",
    purchaseTitle: "खरीद का विश्लेषण",
    purchaseDescription: "इसे किसी खरीद के बाद या अगली आवेगपूर्ण खरीद से पहले इस्तेमाल करें।",
    itemName: "आपने क्या खरीदा?",
    itemPlaceholder: "हेडफ़ोन, जूते, गैजेट...",
    price: "कीमत",
    daysSincePurchase: "खरीद के बाद बीते दिन",
    returnWindow: "वापसी की अवधि (दिनों में)",
    usedTimes: "आपने इसे कितनी बार इस्तेमाल किया है?",
    needLevel: "असली ज़रूरत",
    regretLevel: "खरीद का पछतावा",
    trigger: "खरीद की वजह क्या थी?",
    receipt: "मेरे पास अब भी रसीद या ऑर्डर की पुष्टि है",
    triggers: {
      ad: "विज्ञापन या इन्फ़्लुएंसर",
      sale: "सेल या छूट",
      stress: "तनाव",
      boredom: "बोरियत",
      social: "सामाजिक दबाव",
      need: "असली, नियोजित ज़रूरत",
    },
    low: "कम",
    high: "ज़्यादा",
    decisionTitle: "कोच का फ़ैसला",
    impulseScore: "आवेग स्कोर",
    returnStatus: "वापसी की स्थिति",
    returnOpen: "वापसी अब भी संभव हो सकती है",
    returnClosed: "वापसी शायद अब संभव नहीं है",
    recoverableCash: "वापस मिल सकने वाली नकदी",
    voiceLabel: "कोच का फ़ैसला पढ़ें",
    decisions: {
      return: {
        title: "अगर नीति अनुमति देती है तो लौटा दें",
        description:
          "आपको खरीद का पछतावा है, ज़रूरत कम है और वापसी की अवधि शायद अभी खुली है। आज ही दुकान की नीति देखें।",
        voice:
          "अगला सबसे अच्छा कदम यह है कि अगर दुकान की नीति अनुमति दे तो इस चीज़ को लौटा दें। आपको खरीद का पछतावा है, ज़रूरत कम है और वापसी की अवधि शायद अभी खुली है। पैसा वापस लें और उसे बचत में डालें।",
      },
      sell: {
        title: "इसे बेचें और बेकार सामान को नकदी में बदलें",
        description:
          "अगर आप इसे लौटा नहीं सकते और इस्तेमाल भी नहीं करते, तो इसे बिक्री के लिए लगाएं। उचित कीमत और सात दिन की समयसीमा तय करें।",
        voice:
          "अगला सबसे अच्छा कदम इस चीज़ को बेचना है। अगर आप इसे लौटा नहीं सकते और इस्तेमाल भी नहीं करते, तो बेकार सामान को नकदी में बदलें। उचित कीमत और सात दिन की समयसीमा तय करें।",
      },
      pause: {
        title: "फ़ैसला करने से पहले रुकें",
        description: "संकेत आवेगपूर्ण लगता है। 24 घंटे रुकें, विज्ञापन वाले ट्रिगर हटाएं और शांत मन से फ़ैसला करें।",
        voice:
          "अगला सबसे अच्छा कदम रुकना है। यह खरीद आवेगपूर्ण लगती है। चौबीस घंटे रुकें, विज्ञापन वाले ट्रिगर हटाएं और शांत मन से फ़ैसला करें।",
      },
      keep: {
        title: "रखें, लेकिन सोच-समझकर इस्तेमाल करें",
        description:
          "यह असली ज़रूरत के ज़्यादा करीब लगता है। इसे तभी रखें जब यह किसी चीज़ की जगह ले, कोई समस्या हल करे या नियमित रूप से इस्तेमाल हो।",
        voice:
          "यह खरीद असली ज़रूरत के ज़्यादा करीब लगती है। इसे तभी रखें जब यह किसी चीज़ की जगह ले, कोई असली समस्या हल करे या नियमित रूप से इस्तेमाल हो।",
      },
    },
    unusedTitle: "बेकार पड़ी चीज़ों की जांच",
    unusedDescription: "अपने आसपास की वे चीज़ें जोड़ें जिन्हें आप इस्तेमाल नहीं करते। कुल रकम आपका वापसी लक्ष्य बन जाती है।",
    unusedName: "बेकार पड़ी चीज़",
    unusedValue: "अनुमानित बिक्री मूल्य",
    addItem: "जोड़ें",
    emptyItems: "एक दराज़, एक शेल्फ़ या एक डिब्बे से शुरू करें। पहली बेकार पड़ी चीज़ जोड़ें।",
    sellableTotal: "बेकार पड़ी चीज़ों से मिल सकने वाली नकदी",
    remove: "हटाएं",
    tipsTitle: "खरीदारी की समझ के नियम",
    tips: [
      "गैर-ज़रूरी खरीद के लिए 24 घंटे रुकें।",
      "उन दुकानों की सदस्यता छोड़ें जो आवेगपूर्ण खरीद को उकसाती हैं।",
      "चेकआउट बास्केट की जगह इच्छा-सूची रखें।",
      "कपड़ों और गैजेट के लिए एक आए, एक जाए का नियम अपनाएं।",
      "वापस मिली नकदी को फिर से गायब होने से पहले बचत में डालें।",
    ],
    adTitle: "विज्ञापन रीसेट",
    adCopy:
      "अगर विज्ञापन आपको पीछे, गरीब या अधूरा महसूस कराते हैं, तो यह उस ट्रिगर को म्यूट, अनफ़ॉलो या ब्लॉक करने का संकेत है। आपका ध्यान भी एक वित्तीय संपत्ति है।",
    disclaimer:
      "सिर्फ़ शैक्षिक टूल। वापसी के अधिकार देश, दुकान की नीति और उत्पाद की स्थिति पर निर्भर करते हैं। हमेशा विक्रेता की शर्तें देखें।",
},
  "pt-BR": {
    eyebrow: "Higiene de compras",
    title: "Pare as compras por impulso antes que virem hábito.",
    description:
      "Analise o arrependimento de compra, as devoluções e as coisas sem uso. O Coach FI ajuda você a recuperar dinheiro e a proteger sua atenção da pressão da publicidade.",
    readText:
      "Higiene de compras. Analise uma compra, decida se vai devolver, venda o que não usa e crie um hábito de compra mais tranquilo.",
    purchaseTitle: "Análise da compra",
    purchaseDescription: "Use depois de uma compra ou antes da próxima compra por impulso.",
    itemName: "O que você comprou?",
    itemPlaceholder: "Fone de ouvido, tênis, gadget...",
    price: "Preço",
    daysSincePurchase: "Dias desde a compra",
    returnWindow: "Prazo de devolução em dias",
    usedTimes: "Quantas vezes você usou?",
    needLevel: "Necessidade real",
    regretLevel: "Arrependimento da compra",
    trigger: "O que provocou a compra?",
    receipt: "Ainda tenho a nota fiscal ou a confirmação do pedido",
    triggers: {
      ad: "Anúncio ou influenciador",
      sale: "Promoção ou desconto",
      stress: "Estresse",
      boredom: "Tédio",
      social: "Pressão social",
      need: "Necessidade real e planejada",
    },
    low: "Baixo",
    high: "Alto",
    decisionTitle: "Decisão do coach",
    impulseScore: "Pontuação de impulso",
    returnStatus: "Situação da devolução",
    returnOpen: "A devolução ainda pode ser possível",
    returnClosed: "A devolução provavelmente já não é possível",
    recoverableCash: "Dinheiro que dá para recuperar",
    voiceLabel: "Ler a decisão do coach",
    decisions: {
      return: {
        title: "Devolva se a política permitir",
        description:
          "Você se arrepende da compra, a necessidade é baixa e o prazo de devolução pode ainda estar aberto. Confira a política da loja hoje.",
        voice:
          "O melhor próximo passo é devolver este item, se a política da loja permitir. Você se arrepende da compra, a necessidade é baixa e o prazo de devolução pode ainda estar aberto. Recupere o dinheiro e mande para a poupança.",
      },
      sell: {
        title: "Venda e transforme a bagunça em dinheiro",
        description:
          "Se você não pode devolver, mas não usa, coloque à venda. Defina um preço justo e um prazo de sete dias.",
        voice:
          "O melhor próximo passo é vender este item. Se você não pode devolver e não usa, transforme a bagunça em dinheiro. Defina um preço justo e um prazo de sete dias.",
      },
      pause: {
        title: "Faça uma pausa antes de decidir",
        description: "O sinal parece impulsivo. Espere 24 horas, remova os gatilhos de anúncios e decida com a cabeça mais fria.",
        voice:
          "O melhor próximo passo é fazer uma pausa. A compra parece impulsiva. Espere vinte e quatro horas, remova os gatilhos de anúncios e decida com a cabeça mais fria.",
      },
      keep: {
        title: "Fique com ele, mas use com intenção",
        description:
          "Isso parece mais próximo de uma necessidade real. Fique com ele só se substituir algo, resolver um problema ou for usado com regularidade.",
        voice:
          "Esta compra parece mais próxima de uma necessidade real. Fique com ela só se substituir algo, resolver um problema real ou for usada com regularidade.",
      },
    },
    unusedTitle: "Auditoria de coisas sem uso",
    unusedDescription: "Adicione as coisas ao seu redor que você não usa. O total vira a sua meta de recuperação.",
    unusedName: "Coisa sem uso",
    unusedValue: "Valor estimado de venda",
    addItem: "Adicionar",
    emptyItems: "Comece por uma gaveta, uma prateleira ou uma caixa. Adicione a primeira coisa sem uso.",
    sellableTotal: "Dinheiro possível com coisas sem uso",
    remove: "Remover",
    tipsTitle: "Regras de higiene de compras",
    tips: [
      "Faça uma pausa de 24 horas para compras não essenciais.",
      "Cancele a inscrição nas lojas que provocam compras por impulso.",
      "Mantenha uma lista de desejos em vez de um carrinho de compras.",
      "Use a regra do entra um, sai um para roupas e gadgets.",
      "Mande o dinheiro recuperado para a poupança antes que ele suma de novo.",
    ],
    adTitle: "Reset de publicidade",
    adCopy:
      "Se os anúncios fazem você se sentir para trás, mais pobre ou incompleto, isso é um sinal para silenciar, deixar de seguir ou bloquear o gatilho. Sua atenção também é um ativo financeiro.",
    disclaimer:
      "Ferramenta apenas educacional. Os direitos de devolução dependem do país, da política da loja e do estado do produto. Sempre confira os termos do vendedor.",
},
  tr: {
    eyebrow: "Alışveriş hijyeni",
    title: "Dürtüsel harcamayı alışkanlığa dönüşmeden durdur.",
    description:
      "Alışveriş pişmanlığını, iadeleri ve kullanılmayan eşyaları analiz et. Coach FI nakit geri kazanmana ve dikkatini reklam baskısından korumana yardım eder.",
    readText:
      "Alışveriş hijyeni. Bir alışverişi analiz et, iade edip etmeyeceğine karar ver, kullanmadıklarını sat ve daha sakin bir satın alma alışkanlığı kur.",
    purchaseTitle: "Alışveriş analizi",
    purchaseDescription: "Bunu bir alışverişten sonra ya da bir sonraki dürtüsel alımdan önce kullan.",
    itemName: "Ne satın aldın?",
    itemPlaceholder: "Kulaklık, ayakkabı, cihaz...",
    price: "Fiyat",
    daysSincePurchase: "Alışverişten bu yana geçen gün",
    returnWindow: "İade süresi (gün)",
    usedTimes: "Kaç kez kullandın?",
    needLevel: "Gerçek ihtiyaç",
    regretLevel: "Alışveriş pişmanlığı",
    trigger: "Alışverişi ne tetikledi?",
    receipt: "Fiş ya da sipariş onayı hâlâ bende",
    triggers: {
      ad: "Reklam veya influencer",
      sale: "İndirim veya kampanya",
      stress: "Stres",
      boredom: "Can sıkıntısı",
      social: "Sosyal baskı",
      need: "Gerçek, planlı ihtiyaç",
    },
    low: "Düşük",
    high: "Yüksek",
    decisionTitle: "Koçun kararı",
    impulseScore: "Dürtü puanı",
    returnStatus: "İade durumu",
    returnOpen: "İade hâlâ mümkün olabilir",
    returnClosed: "İade büyük olasılıkla artık mümkün değil",
    recoverableCash: "Geri kazanılabilecek nakit",
    voiceLabel: "Koçun kararını oku",
    decisions: {
      return: {
        title: "Koşullar izin veriyorsa iade et",
        description:
          "Alışverişten pişmansın, ihtiyaç düşük ve iade süresi hâlâ açık olabilir. Mağazanın koşullarına bugün bak.",
        voice:
          "En iyi sonraki adım, mağaza koşulları izin veriyorsa bu ürünü iade etmek. Alışverişten pişmansın, ihtiyaç düşük ve iade süresi hâlâ açık olabilir. Parayı geri al ve birikime aktar.",
      },
      sell: {
        title: "Sat ve dağınıklığı nakde çevir",
        description:
          "İade edemiyorsan ama kullanmıyorsan satışa koy. Adil bir fiyat ve yedi günlük bir süre belirle.",
        voice:
          "En iyi sonraki adım bu ürünü satmak. İade edemiyorsan ve kullanmıyorsan dağınıklığı nakde çevir. Adil bir fiyat ve yedi günlük bir süre belirle.",
      },
      pause: {
        title: "Karar vermeden önce dur",
        description: "Sinyal dürtüsel görünüyor. 24 saat bekle, reklam tetikleyicilerini kaldır ve daha sakin kafayla karar ver.",
        voice:
          "En iyi sonraki adım durmak. Alışveriş dürtüsel görünüyor. Yirmi dört saat bekle, reklam tetikleyicilerini kaldır ve daha sakin kafayla karar ver.",
      },
      keep: {
        title: "Sende kalsın, ama bilinçli kullan",
        description:
          "Bu, gerçek bir ihtiyaca daha yakın görünüyor. Yalnızca bir şeyin yerini alıyorsa, bir sorunu çözüyorsa veya düzenli kullanılıyorsa sende kalsın.",
        voice:
          "Bu alışveriş gerçek bir ihtiyaca daha yakın görünüyor. Yalnızca bir şeyin yerini alıyorsa, gerçek bir sorunu çözüyorsa veya düzenli kullanılıyorsa sende kalsın.",
      },
    },
    unusedTitle: "Kullanılmayan eşya denetimi",
    unusedDescription: "Çevrendeki kullanmadığın eşyaları ekle. Toplam, geri kazanım hedefin olur.",
    unusedName: "Kullanılmayan eşya",
    unusedValue: "Tahmini satış değeri",
    addItem: "Ekle",
    emptyItems: "Bir çekmeceyle, bir rafla ya da bir kutuyla başla. Kullanmadığın ilk eşyayı ekle.",
    sellableTotal: "Kullanılmayan eşyalardan olası nakit",
    remove: "Kaldır",
    tipsTitle: "Alışveriş hijyeni kuralları",
    tips: [
      "Zorunlu olmayan alışverişlerde 24 saat bekle.",
      "Dürtüsel alışverişi tetikleyen mağazaların aboneliğinden çık.",
      "Alışveriş sepeti yerine istek listesi tut.",
      "Giysi ve cihazlarda bir giren, bir çıkar kuralını uygula.",
      "Geri kazandığın nakdi yeniden kaybolmadan birikime aktar.",
    ],
    adTitle: "Reklam sıfırlaması",
    adCopy:
      "Reklamlar sana geride, daha yoksul veya eksik hissettiriyorsa bu, tetikleyiciyi sessize alma, takipten çıkma veya engelleme işaretidir. Dikkatin de finansal bir varlıktır.",
    disclaimer:
      "Yalnızca eğitim amaçlı araç. İade hakları ülkeye, mağaza koşullarına ve ürünün durumuna göre değişir. Satıcının koşullarını mutlaka kontrol et.",
},
};

const UNUSED_AUDIT_ERROR: LocalizedMap<(maximum: string) => string> = {
  pl: (maximum) =>
    `Podaj nazwę rzeczy i dodatnią kwotę z dokładnością do grosza. Kwota i suma listy nie mogą przekraczać ${maximum}.`,
  en: (maximum) =>
    `Enter an item name and a positive amount in steps of 0.01. The item and combined total must not exceed ${maximum}.`,
};

const PURCHASE_PRICE_ERROR: LocalizedMap<(maximum: string) => string> = {
  pl: (maximum) => `Podaj cenę od 0 do ${maximum} z dokładnością do grosza.`,
  en: (maximum) => `Enter a price from 0 to ${maximum} in steps of 0.01.`,
};

const PURCHASE_DAYS_ERROR: LocalizedMap<string> = {
  pl: "Podaj liczbę dni od zakupu równą 0 lub większą.",
  en: "Enter the days since purchase as a number of 0 or more.",
};

function parsePurchaseDays(raw: string): number | null {
  const text = raw.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
  const days = Number(text);
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0 && /[1-9]/.test(text.replace(/[eE].*$/, ""))) return null;
  return days === 0 ? 0 : days;
}

const PURCHASE_COUNT_ERROR: LocalizedMap<{ usedTimes: string; returnWindow: string }> = {
  pl: {
    usedTimes: "Podaj liczbę użyć równą 0 lub większą.",
    returnWindow: "Podaj okno zwrotu wynoszące co najmniej 1 dzień.",
  },
  en: {
    usedTimes: "Enter the number of uses as a number of 0 or more.",
    returnWindow: "Enter a return window of at least 1 day.",
  },
};

function parsePurchaseCount(raw: string, minimum: number): number | null {
  const count = parsePurchaseDays(raw);
  return count === null || count < minimum ? null : count;
}

export default function ShoppingPage() {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(SHOPPING_COPY, locale);
  const [itemName, setItemName] = useState("");
  const [priceRaw, setPriceRaw] = useState("249");
  const [daysRaw, setDaysRaw] = useState("3");
  const [returnWindowRaw, setReturnWindowRaw] = useState("14");
  const [usedTimesRaw, setUsedTimesRaw] = useState("0");
  const [needLevel, setNeedLevel] = useState(2);
  const [regretLevel, setRegretLevel] = useState(4);
  const [trigger, setTrigger] = useState<Trigger>("ad");
  const [hasReceipt, setHasReceipt] = useState(true);
  const [unusedItems, setUnusedItems] = useState<UnusedItem[]>([]);
  const unusedItemsRef = useRef<UnusedItem[]>([]);
  const nextUnusedId = useRef(0);
  const [unusedName, setUnusedName] = useState("");
  const [unusedValue, setUnusedValue] = useState("80");
  const [unusedIssue, setUnusedIssue] = useState(false);

  const priceCents = parseShoppingPriceCents(priceRaw);
  const price = priceCents === null ? null : priceCents / 100;
  const daysSincePurchase = parsePurchaseDays(daysRaw);
  const returnWindow = parsePurchaseCount(returnWindowRaw, 1);
  const usedTimes = parsePurchaseCount(usedTimesRaw, 0);
  const analysis = useMemo(() => {
    if (price === null || daysSincePurchase === null || returnWindow === null || usedTimes === null) return null;
    const returnOpen = hasReceipt && daysSincePurchase <= returnWindow;
    const impulseTrigger = trigger !== "need";
    const impulseScore = clamp(
      Math.round(
        regretLevel * 17 +
          (6 - needLevel) * 13 +
          (usedTimes === 0 ? 14 : usedTimes <= 1 ? 8 : 0) +
          (impulseTrigger ? 14 : -6) +
          (price >= 500 ? 8 : price >= 150 ? 4 : 0)
      ),
      0,
      100
    );

    const decision: DecisionKey =
      returnOpen && regretLevel >= 4 && needLevel <= 2
        ? "return"
        : needLevel <= 2 && (usedTimes <= 1 || regretLevel >= 3)
          ? "sell"
          : impulseScore >= 55
            ? "pause"
            : "keep";

    const recoverableCash = decision === "return" ? price : Math.round(price * 0.6);

    return { decision, impulseScore, returnOpen, recoverableCash };
  }, [daysSincePurchase, hasReceipt, needLevel, price, regretLevel, returnWindow, trigger, usedTimes]);

  const decisionCopy = analysis ? copy.decisions[analysis.decision] : null;
  const marketCurrency = useMemo(
    () => new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
      style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
    }),
    [locale]
  );
  const formatAmount = (amount: number) => locale === "pl" || locale === "en"
    ? marketCurrency.format(amount)
    : formatCurrency(amount, t.currency, locale);
  const sellableTotal = unusedItems.reduce((total, item) => total + item.valueCents, 0) / 100;
  const unusedError = pickLocalized(UNUSED_AUDIT_ERROR, locale)(formatAmount(FINANCIAL_AMOUNT_MAX));
  const priceError = pickLocalized(PURCHASE_PRICE_ERROR, locale)(formatAmount(FINANCIAL_AMOUNT_MAX));
  const daysError = pickLocalized(PURCHASE_DAYS_ERROR, locale);
  const countErrors = pickLocalized(PURCHASE_COUNT_ERROR, locale);
  const purchaseLabel = itemName.trim() || copy.itemPlaceholder.replace("...", "");
  const voiceText = analysis && decisionCopy ? limitVoiceText(
    [
      decisionCopy.voice,
      `${copy.impulseScore}: ${analysis.impulseScore} out of 100.`,
      `${copy.recoverableCash}: ${formatAmount(analysis.recoverableCash)}.`,
      sellableTotal > 0
        ? `${copy.sellableTotal}: ${formatAmount(sellableTotal)}.`
        : copy.emptyItems,
    ].join(" ")
  ) : "";

  function addUnusedItem() {
    const cleanName = unusedName.trim();
    const valueCents = parseShoppingAmountCents(unusedValue);
    const current = unusedItemsRef.current;
    if (!cleanName || valueCents === null ||
      shoppingTotalCents([...current.map((item) => item.valueCents), valueCents]) === null) {
      setUnusedIssue(true);
      return;
    }
    const next = [...current, { id: ++nextUnusedId.current, name: cleanName, valueCents }];
    unusedItemsRef.current = next;
    setUnusedItems(next);
    setUnusedName("");
    setUnusedValue("80");
    setUnusedIssue(false);
  }

  function removeUnusedItem(id: number) {
    const current = unusedItemsRef.current;
    const next = current.filter((item) => item.id !== id);
    if (next.length === current.length) return;
    unusedItemsRef.current = next;
    setUnusedItems(next);
    setUnusedIssue(false);
  }

  return (
    <section>
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>{copy.purchaseTitle}</CardTitle>
                <CardDescription>{copy.purchaseDescription}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField
              label={copy.itemName}
              value={itemName}
              placeholder={copy.itemPlaceholder}
              onChange={setItemName}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-text">
                {copy.price}
                <input
                  type="number"
                  min={0}
                  max={FINANCIAL_AMOUNT_MAX}
                  step="0.01"
                  value={priceRaw}
                  aria-invalid={price === null}
                  aria-describedby={price === null ? "shopping-price-error" : undefined}
                  onChange={(event) => setPriceRaw(event.target.value)}
                  className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <NumberField
                label={copy.usedTimes} value={usedTimesRaw} min={0} onChange={setUsedTimesRaw}
                invalid={usedTimes === null} errorId="shopping-used-times-error"
              />
              <label className="grid gap-2 text-sm font-bold text-text">
                {copy.daysSincePurchase}
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={daysRaw}
                  aria-invalid={daysSincePurchase === null}
                  aria-describedby={daysSincePurchase === null ? "shopping-days-error" : undefined}
                  onChange={(event) => setDaysRaw(event.target.value)}
                  className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <NumberField
                label={copy.returnWindow} value={returnWindowRaw} min={1} onChange={setReturnWindowRaw}
                invalid={returnWindow === null} errorId="shopping-return-window-error"
              />
            </div>
            {price === null ? <p id="shopping-price-error" role="alert" className="text-sm font-bold text-attention">{priceError}</p> : null}
            {daysSincePurchase === null ? <p id="shopping-days-error" role="alert" className="text-sm font-bold text-attention">{daysError}</p> : null}
            {usedTimes === null ? <p id="shopping-used-times-error" role="alert" className="text-sm font-bold text-attention">{countErrors.usedTimes}</p> : null}
            {returnWindow === null ? <p id="shopping-return-window-error" role="alert" className="text-sm font-bold text-attention">{countErrors.returnWindow}</p> : null}
            <RangeField
              label={copy.needLevel}
              value={needLevel}
              low={copy.low}
              high={copy.high}
              onChange={setNeedLevel}
            />
            <RangeField
              label={copy.regretLevel}
              value={regretLevel}
              low={copy.low}
              high={copy.high}
              onChange={setRegretLevel}
            />
            <label className="grid gap-2 text-sm font-bold text-text">
              {copy.trigger}
              <select
                value={trigger}
                onChange={(event) => setTrigger(event.target.value as Trigger)}
                className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {(Object.keys(copy.triggers) as Trigger[]).map((key) => (
                  <option key={key} value={key}>
                    {copy.triggers[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm font-bold text-text">
              <input
                type="checkbox"
                checked={hasReceipt}
                onChange={(event) => setHasReceipt(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-primary/30 text-primary"
              />
              <span>{copy.receipt}</span>
            </label>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          {analysis && decisionCopy ? (
          <Card className="overflow-hidden">
            <CardHeader className="gap-4 space-y-0 md:flex md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-primary">{copy.decisionTitle}</p>
                <CardTitle className="mt-2 text-2xl">{decisionCopy.title}</CardTitle>
                <CardDescription className="mt-2">{decisionCopy.description}</CardDescription>
              </div>
              <VoiceButton
                text={voiceText}
                label={copy.voiceLabel}
                locale={locale}
                variant="pill"
                className="shrink-0"
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "rounded-lg border p-5",
                  analysis.decision === "return" && "border-success/40 bg-success/20",
                  analysis.decision === "sell" && "border-accent/70 bg-accent/30",
                  analysis.decision === "pause" && "border-warning/50 bg-warning/20",
                  analysis.decision === "keep" && "border-primary/20 bg-primary/5"
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-muted">{purchaseLabel}</p>
                    <p className="mt-1 text-4xl font-black leading-none text-text">
                      {formatAmount(analysis.recoverableCash)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-muted">{copy.recoverableCash}</p>
                  </div>
                  <DecisionIcon decision={analysis.decision} />
                </div>
              </div>
            </CardContent>
          </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            {analysis ? (
            <>
            <MetricBox
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              label={copy.impulseScore}
              value={`${analysis.impulseScore}/100`}
            />
            <MetricBox
              icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
              label={copy.returnStatus}
              value={analysis.returnOpen ? copy.returnOpen : copy.returnClosed}
            />
            </>
            ) : null}
            <MetricBox
              icon={<Coins className="h-5 w-5" aria-hidden="true" />}
              label={copy.sellableTotal}
              value={formatAmount(sellableTotal)}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.unusedTitle}</CardTitle>
            <CardDescription>{copy.unusedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <TextField label={copy.unusedName} value={unusedName} onChange={setUnusedName} />
              <label className="grid gap-2 text-sm font-bold text-text">
                {copy.unusedValue}
                <input
                  type="number"
                  min={0}
                  max={FINANCIAL_AMOUNT_MAX}
                  step="0.01"
                  value={unusedValue}
                  onChange={(event) => setUnusedValue(event.target.value)}
                  className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <Button type="button" onClick={addUnusedItem} className="self-end">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {copy.addItem}
              </Button>
            </div>

            {unusedIssue ? <p role="alert" className="text-sm font-bold text-attention">{unusedError}</p> : null}

            {unusedItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 text-sm font-bold leading-6 text-muted">
                {copy.emptyItems}
              </div>
            ) : (
              <div className="grid gap-2">
                {unusedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-primary/10 bg-white/75 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-text">{item.name}</p>
                      <p className="text-sm font-bold text-muted">{formatAmount(item.valueCents / 100)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUnusedItem(item.id)}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary/15 bg-white px-3 text-sm font-bold text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copy.remove}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent/50 text-text">
                <MegaphoneOff className="h-5 w-5" aria-hidden="true" />
              </span>
              <CardTitle>{copy.tipsTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {copy.tips.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm font-bold leading-6 text-text">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/50 text-text">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary/30 text-text">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black text-text">{copy.adTitle}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-muted">{copy.adCopy}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold leading-6 text-muted">{copy.disclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
  invalid,
  errorId,
}: {
  label: string;
  value: string;
  min: number;
  onChange: (value: string) => void;
  invalid: boolean;
  errorId: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      {label}
      <input
        type="number"
        min={min}
        step="any"
        value={value}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </label>
  );
}

function RangeField({
  label,
  value,
  low,
  high,
  onChange,
}: {
  label: string;
  value: number;
  low: string;
  high: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">{value}/5</span>
      </span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 accent-primary"
      />
      <span className="flex justify-between text-xs font-bold text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </span>
    </label>
  );
}

function MetricBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-white p-4 shadow-soft">
      <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 text-xl font-black leading-tight text-text">{value}</p>
    </div>
  );
}

function DecisionIcon({ decision }: { decision: DecisionKey }) {
  const className = "h-10 w-10";

  if (decision === "return") {
    return (
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-text">
        <Undo2 className={className} aria-hidden="true" />
      </span>
    );
  }

  if (decision === "sell") {
    return (
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-text">
        <Coins className={className} aria-hidden="true" />
      </span>
    );
  }

  if (decision === "pause") {
    return (
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-text">
        <RotateCcw className={className} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-primary">
      <PackageCheck className={className} aria-hidden="true" />
    </span>
  );
}

function limitVoiceText(text: string) {
  if (text.length <= 480) return text;
  return `${text.slice(0, 477).trimEnd()}...`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
