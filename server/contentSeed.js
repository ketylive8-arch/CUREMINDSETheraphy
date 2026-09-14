"use strict";
/**
 * server/contentSeed.js — זריעת קטלוג תוכן אמיתי (ContentSource + ContentModule).
 * 10 נושאים × 2 יחידות = 20 יחידות. תוכן מקורי בעברית בקול CureMindset.
 * לא הועתק מ-Curable/BetterHelp/Tony Robbins/Steve Andreas — עקרונות כלליים בלבד.
 *
 * כל יחידה מסומנת needs_content_review=1: זהו נוסח בסיס תקין ובטוח, שקטי
 * אמורה להעשיר/לאשר ולהוסיף אודיו אמיתי. seed אידמפוטנטי (INSERT OR IGNORE).
 */
const { db } = require("./db");

// ── מקורות מאושרים (ממופים למאגר הידע הקיים של קטי) ──
const SOURCES = [
  { source_id: "kb-shita", title: "בסיס השיטה — CureMindset", url_path: "server/knowledge_base/00-shita-basis.md", source_type: "method", rights_status: "owned", topic: "method", audience: "all", sensitivity: "low" },
  { source_id: "kb-anxiety", title: "פרוטוקול חרדה", url_path: "server/knowledge_base/01-anxiety-protocol.md", source_type: "method", rights_status: "owned", topic: "anxiety", audience: "all", sensitivity: "medium" },
  { source_id: "kb-neuro", title: "נוירופלסטיות", url_path: "server/knowledge_base/02-neuroplasticity.md", source_type: "lesson", rights_status: "owned", topic: "brain", audience: "all", sensitivity: "medium" },
  { source_id: "kb-anchor", title: "עוגן הבית", url_path: "server/knowledge_base/05-anchor-home-protocol.md", source_type: "method", rights_status: "owned", topic: "regulation", audience: "all", sensitivity: "low" },
  { source_id: "kb-future", title: "Future Pacing", url_path: "server/knowledge_base/07-future-pacing.md", source_type: "method", rights_status: "owned", topic: "confidence", audience: "all", sensitivity: "low" },
  { source_id: "kb-youth", title: "מודולים לנוער", url_path: "server/knowledge_base/04-youth-modules.md", source_type: "method", rights_status: "owned", topic: "youth", audience: "youth", sensitivity: "medium" },
  { source_id: "kb-alarm", title: "מודל האזעקה — יום 1", url_path: "server/knowledge_base/14-alarm-model-day1.md", source_type: "lesson", rights_status: "owned", topic: "anxiety", audience: "all", sensitivity: "medium" },
];

// עוזר: יחידה עם ברירות-מחדל בטוחות.
function M(o) {
  return {
    audience: "all", format: "mixed", duration_min: 5, sensitivity: "low",
    audio_url: "", // TODO: קטי מוסיפה הקלטת אודיו אמיתית
    reward: "בחרת להשקיע בעצמך היום — זה נחשב.",
    safety_note: "זהו תרגול לחוסן אישי, לא טיפול. אם עולה מצוקה חזקה — ער\"ן 1201, מד\"א 101.",
    version: "1.0", status: "published", ...o,
  };
}

// ── 10 נושאים × 2 יחידות ──
const MODULES = [
  // 1) חרדה
  M({ slug: "anxiety-alarm", topic: "anxiety", sort_order: 1, title: "להבין את האזעקה", objective: "להבין שחרדה היא אזעקה של הגוף — לא סכנה אמיתית — וללמוד לזהות אותה מוקדם.",
    explanation: "כשעולה חרדה, החלק הרגשי במוח מפעיל 'אזעקה' ומשתלט על החשיבה ההגיונית. זו תגובת הגנה טבעית, לא תקלה. ברגע שמזהים את האזעקה כמה שהיא — עוצמתה יורדת.",
    exercise: "כשאת מרגישה שהחרדה עולה, אמרי לעצמך במילים: 'זו אזעקה, לא סכנה'. שמי יד על החזה ונשמי 4 שניות פנימה, 6 שניות החוצה, שלוש פעמים.",
    transcript: "הקלטה (טקסט): נתמקד יחד בנשימה. שאיפה איטית... אחת, שתיים, שלוש, ארבע. ועכשיו נשיפה ארוכה... הגוף לומד שאפשר להירגע.",
    reflection: "מתי היום הרגשת את האזעקה הכי חזק — ומה קרה בגוף באותו רגע?", next_step: "anxiety-anchor", source_ids: ["kb-anxiety", "kb-alarm"], sensitivity: "medium" }),
  M({ slug: "anxiety-anchor", topic: "anxiety", sort_order: 2, title: "עוגן הרגעה מהיר", objective: "לבנות כלי אישי שאפשר להפעיל תוך פחות מדקה בכל רגע לחץ.", duration_min: 4,
    explanation: "עוגן הוא תנועה קטנה שמקושרת לתחושת ביטחון. כשמחזקים אותו בתרגול, אפשר להפעיל אותו ברגע אמת — במבחן, לפני שיחה, או בלילה.",
    exercise: "חברי אגודל לאצבע והיזכרי ברגע שבו הרגשת בטוחה ורגועה. שהי שם 20 שניות. חזרי על זה 3 פעמים. עכשיו העוגן שלך מוכן.",
    transcript: "הקלטה (טקסט): נחבר את האצבעות בעדינות, ונחזור לרגע שבו הכל היה בסדר. הגוף זוכר את הרוגע הזה.",
    reflection: "איזה רגע בחרת לעוגן — ולמה דווקא הוא?", next_step: "regulation-box-breath", source_ids: ["kb-anchor", "kb-anxiety"], sensitivity: "medium" }),

  // 2) לחץ והצפה
  M({ slug: "stress-unload", topic: "stress", sort_order: 1, title: "כשהכל יותר מדי", objective: "לפרק תחושת הצפה לצעד אחד קטן שאפשר לעשות עכשיו.",
    explanation: "הצפה קורית כשהמוח מנסה להחזיק הכל בבת אחת. הפתרון אינו 'להתאמץ יותר' — אלא לצמצם את השדה לפעולה אחת בלבד.",
    exercise: "כתבי במשפט אחד מה הכי מעיק עלייך עכשיו. עכשיו בחרי צעד אחד קטן שלוקח פחות מ-5 דקות, ועשי רק אותו.",
    transcript: "הקלטה (טקסט): לא צריך לפתור הכל. רק את הצעד הקטן הבא. נשימה אחת, ואז פעולה אחת.",
    reflection: "איזה צעד קטן בחרת — ואיך הרגיש לסיים אותו?", next_step: "stress-boundaries", source_ids: ["kb-shita"], sensitivity: "low" }),
  M({ slug: "stress-boundaries", topic: "stress", sort_order: 2, title: "גבול קטן ליום עמוס", objective: "לתרגל אמירת 'לא' אחת קטנה שמחזירה שליטה.", duration_min: 6,
    explanation: "לחץ מתמשך נבנה מהרבה 'כן' קטנים שלא רצינו. גבול בריא אחד ביום מוריד עומס יותר ממה שנדמה.",
    exercise: "בחרי בקשה אחת שתגיע היום שאפשר לומר לה 'לא' או 'לא עכשיו'. תרגלי את המשפט בקול לפני שזה קורה.",
    transcript: "הקלטה (טקסט): גבול הוא לא ניתוק. הוא דרך לשמור על עצמך כדי שיישאר לך כוח למה שחשוב.",
    reflection: "על מה בחרת לשים גבול — ואיך הגוף הגיב למחשבה הזו?", next_step: "regulation-box-breath", source_ids: ["kb-shita"], sensitivity: "low" }),

  // 3) דימוי עצמי
  M({ slug: "selfimage-inner-critic", topic: "self_image", sort_order: 1, title: "הקול המבקר", objective: "לזהות את הקול הפנימי הביקורתי ולהתחיל להפריד בינו לבינך.",
    explanation: "הקול המבקר נשמע כמו אמת, אבל הוא רק דפוס ישן שניסה פעם להגן עלייך. אפשר להקשיב לו בלי לציית לו.",
    exercise: "כתבי משפט ביקורתי שאת אומרת לעצמך. עכשיו כתבי אותו שוב, אבל שמפתחת: 'חלק בי חושב ש...'. שימי לב איך זה משנה את התחושה.",
    transcript: "הקלטה (טקסט): הקול הזה הוא לא את. הוא חלק. ואפשר ללמד אותו לדבר איתך אחרת.",
    reflection: "מה הקול המבקר הכי חוזר עליו — ומתי הוא הופיע לראשונה בחייך?", next_step: "selfimage-kind-voice", source_ids: ["kb-shita"], sensitivity: "medium" }),
  M({ slug: "selfimage-kind-voice", topic: "self_image", sort_order: 2, title: "הקול המיטיב", objective: "לבנות קול פנימי תומך שמדבר אלייך כמו אל חבר יקר.", duration_min: 6,
    explanation: "אותו מוח שיודע לבקר יודע גם לתמוך. הקול המיטיב אינו חנופה — הוא אמת חמה.",
    exercise: "חשבי על מה שהיית אומרת לחברה טובה במצבך. עכשיו אמרי את זה לעצמך, בגוף שני: 'את...'. חזרי על המשפט שלוש פעמים.",
    transcript: "הקלטה (טקסט): מגיע לך אותו חום שאת נותנת לאחרים. נתרגל להחזיר אותו פנימה.",
    reflection: "איזה משפט תומך בחרת — והאם היה קשה להגיד אותו לעצמך?", next_step: "confidence-future", source_ids: ["kb-shita"], sensitivity: "medium" }),

  // 4) ביטחון עצמי
  M({ slug: "confidence-future", topic: "confidence", sort_order: 1, title: "לדמיין את ההצלחה", objective: "לתרגל Future Pacing — חזרה מנטלית להתמודדות מוצלחת.",
    explanation: "המוח לא תמיד מבחין בין דמיון עשיר לחוויה אמיתית. חזרה מנטלית על סיטואציה מוצלחת בונה מסלול עצבי של ביטחון.",
    exercise: "בחרי סיטואציה קרובה שמלחיצה אותך. דמייני אותה מסתיימת טוב — מה את רואה, שומעת ומרגישה בגוף כשזה מצליח? שהי שם דקה.",
    transcript: "הקלטה (טקסט): נראה את עצמך עומדת שם, נושמת, יציבה. זה כבר קורה בתוכך.",
    reflection: "איזו סיטואציה תרגלת — ומה השתנה בתחושה לגביה?", next_step: "confidence-small-wins", source_ids: ["kb-future"], sensitivity: "low" }),
  M({ slug: "confidence-small-wins", topic: "confidence", sort_order: 2, title: "ניצחונות קטנים", objective: "לבנות ביטחון מבפנים דרך תיעוד הצלחות קטנות — לא אישור חיצוני.", duration_min: 4,
    explanation: "ביטחון אמיתי נבנה מהוכחות, לא ממחמאות. כל צעד קטן שהשלמת הוא הוכחה שאפשר לסמוך עלייך.",
    exercise: "כתבי שלושה דברים קטנים שעשית היום, גם אם נראים מובנים מאליהם. קראי אותם שוב בקול.",
    transcript: "הקלטה (טקסט): לא צריך הישג גדול. שלושה דברים קטנים מספיקים כדי להזכיר למוח מי את.",
    reflection: "איזה מהשלושה הכי הפתיע אותך שספרת?", next_step: "procrastination-first-step", source_ids: ["kb-shita"], sensitivity: "low" }),

  // 5) דחיינות
  M({ slug: "procrastination-first-step", topic: "procrastination", sort_order: 1, title: "השורש הרגשי של הדחייה", objective: "להבין שדחיינות היא לרוב הימנעות מרגש — לא עצלות.",
    explanation: "מאחורי דחייה מסתתר בדרך כלל פחד: מכישלון, מחוסר שלמות, או מהצפה. כשמזהים את הרגש, המשימה נעשית קטנה יותר.",
    exercise: "בחרי משימה שאת דוחה. שאלי את עצמך: 'מאיזה רגש אני נמנעת כאן?'. עכשיו עשי רק את הצעד הראשון, למשך שתי דקות בלבד.",
    transcript: "הקלטה (טקסט): לא צריך לסיים. רק להתחיל. שתי דקות, וזהו.",
    reflection: "איזה רגש עמד מאחורי הדחייה — והאם שתי הדקות הרגישו קשות כמו שחשבת?", next_step: "procrastination-two-minutes", source_ids: ["kb-shita"], sensitivity: "low" }),
  M({ slug: "procrastination-two-minutes", topic: "procrastination", sort_order: 2, title: "כלל שתי הדקות", objective: "להשתמש בפעולה קצרה כדי לשבור התנגדות.", duration_min: 3,
    explanation: "ההתנגדות הכי גדולה היא לפני ההתחלה. אחרי שמתחילים שתי דקות, המוח לרוב ממשיך מעצמו.",
    exercise: "הגדירי טיימר לשתי דקות ותתחילי את המשימה הקטנה ביותר בתוכה. כשהטיימר נגמר — את חופשית לעצור או להמשיך.",
    transcript: "הקלטה (טקסט): שתי דקות זה חוזה קטן עם עצמך. ההתחלה היא הניצחון.",
    reflection: "המשכת אחרי שתי הדקות או עצרת — ואיך הרגיש להתחיל?", next_step: "regulation-box-breath", source_ids: ["kb-shita"], sensitivity: "low" }),

  // 6) התנהגויות ממכרות
  M({ slug: "habits-urge-surf", topic: "addiction", sort_order: 1, title: "לגלוש על הדחף", objective: "ללמוד שדחף חולף כמו גל — בלי להיאבק בו ובלי להיכנע לו.", sensitivity: "medium",
    explanation: "דחף מרגיש כאילו יימשך לנצח, אבל הוא עולה, מגיע לשיא ודועך תוך כמה דקות. אפשר 'לגלוש' עליו במקום להילחם.",
    exercise: "כשעולה דחף, אל תפעלי מיד. שבי איתו 3 דקות, שמי לב איפה הוא בגוף, ונשמי. צפי בו עולה ויורד כמו גל.",
    transcript: "הקלטה (טקסט): הגל יעלה, יגיע לשיא, וירד. את לא הגל — את מי שמתבונן בו.",
    reflection: "כמה זמן לקח לדחף לדעוך — והאם זה היה שונה ממה שציפית?", next_step: "habits-replace", source_ids: ["kb-shita"], safety_note: "אם מדובר בהתמכרות שפוגעת בתפקוד או בבטיחות — חשוב לפנות לאיש מקצוע. ער\"ן 1201.", sensitivity: "medium" }),
  M({ slug: "habits-replace", topic: "addiction", sort_order: 2, title: "מה הדפוס נותן לי", objective: "לזהות את הצורך שמאחורי ההרגל, ולמצוא לו חלופה עדינה.", duration_min: 6, sensitivity: "medium",
    explanation: "כל הרגל, גם מזיק, ניסה למלא צורך אמיתי — רוגע, בריחה, שליטה. שינוי מתחיל בזיהוי הצורך, לא בהילחמות בהרגל.",
    exercise: "כתבי: 'ההרגל הזה נותן לי ___'. עכשיו חשבי על דבר אחד קטן ובריא יותר שיכול לתת ולו חלק מזה.",
    transcript: "הקלטה (טקסט): לא מנתקים צורך. מוצאים לו דרך חדשה, עדינה יותר, להתמלא.",
    reflection: "איזה צורך גילית מאחורי הדפוס?", next_step: "regulation-box-breath", source_ids: ["kb-shita"], safety_note: "התמכרות פעילה דורשת ליווי מקצועי. זהו כלי תומך בלבד. ער\"ן 1201.", sensitivity: "medium" }),

  // 7) ויסות רגשי
  M({ slug: "regulation-box-breath", topic: "regulation", sort_order: 1, title: "נשימת קופסה", objective: "כלי נשימה מהיר להחזרת הגוף לאיזון תוך דקה.",
    explanation: "נשימה איטית ומדודה מאותתת למערכת העצבים שאפשר להירגע. נשימת קופסה היא מקצב פשוט שקל לזכור בכל מצב.",
    exercise: "שאיפה 4 שניות · החזקה 4 · נשיפה 4 · החזקה 4. חזרי שלושה סבבים. אם 4 קשה — התחילי מ-3.",
    transcript: "הקלטה (טקסט): נכניס אוויר... נחזיק... נשחרר... נחזיק. ריבוע רגוע, שוב ושוב.",
    reflection: "איך הגוף הרגיש אחרי שלושת הסבבים לעומת לפני?", next_step: "regulation-name-it", source_ids: ["kb-anchor"], sensitivity: "low" }),
  M({ slug: "regulation-name-it", topic: "regulation", sort_order: 2, title: "לתת שם לרגש", objective: "להרגיע את המוח דרך שיום מדויק של הרגש.", duration_min: 4,
    explanation: "מחקר בפסיכולוגיה מראה שכשמנסחים רגש במילה, עוצמתו יורדת. 'שיום מרגיע'. (מקור: עקרון כללי — לאישור ניסוח.)",
    exercise: "עצרי ושאלי: 'מה בדיוק אני מרגישה עכשיו?'. נסי למצוא את המילה המדויקת — לא 'רע', אלא 'אכזבה', 'בדידות', 'עומס'.",
    transcript: "הקלטה (טקסט): כשנותנים לרגש שם מדויק, הוא מפסיק להיות ענן ומתחיל להיות משהו שאפשר להחזיק.",
    reflection: "איזו מילה הכי דייקה את מה שהרגשת?", next_step: "communication-i-message", source_ids: ["kb-shita"], sensitivity: "low" }),

  // 8) נוער
  M({ slug: "youth-who-am-i", topic: "youth", audience: "youth", sort_order: 1, title: "מי אני מעבר לדעות", objective: "לחזק תחושת ערך שלא תלויה באישור של אחרים.", sensitivity: "medium",
    explanation: "בגיל הזה קל להרגיש שהערך שלך נמדד בלייקים ובדעות של אחרים. אבל מי שאת נבנה מבפנים — לא ממה שאומרים עלייך.",
    exercise: "כתבי שלושה דברים שאת אוהבת בעצמך שאף אחד לא צריך לאשר — תכונה, דבר שאת עושה, או דרך שאת מתייחסת לאחרים.",
    transcript: "הקלטה (טקסט): את לא מספר של עוקבים. את הרבה יותר, וזה שלך.",
    reflection: "איזה מהשלושה היה הכי קשה לכתוב — ולמה?", next_step: "youth-exam-calm", source_ids: ["kb-youth"], sensitivity: "medium" }),
  M({ slug: "youth-exam-calm", topic: "youth", audience: "youth", sort_order: 2, title: "רגע לפני מבחן", objective: "כלי הרגעה קצר לפני מבחן או מצב חברתי מלחיץ.", duration_min: 3, sensitivity: "medium",
    explanation: "חרדת מבחן היא אזעקה של הגוף, לא סימן שתיכשלי. אפשר להוריד אותה בכמה נשימות ומשפט אחד.",
    exercise: "לפני המבחן: יד על הבטן, שלוש נשימות איטיות, ואמרי בשקט 'אני מוכנה מספיק, ואני אעשה את מה שאני יכולה'.",
    transcript: "הקלטה (טקסט): הלב דופק כי הגוף מתכונן, לא כי משהו רע. ננשום, ונתחיל.",
    reflection: "איך הרגיש הגוף אחרי שלוש הנשימות?", next_step: "parenting-listen", source_ids: ["kb-youth"], sensitivity: "medium" }),

  // 9) הורות
  M({ slug: "parenting-listen", topic: "parenting", audience: "parent", sort_order: 1, title: "להקשיב בלי לתקן", objective: "לתרגל הקשבה שמרגיעה את הילד/ה במקום לפתור מיד.",
    explanation: "כשילד/ה במצוקה, הדחף לתקן מהיר — אבל לרוב הם צריכים קודם להרגיש מובנים. הקשבה היא הכלי הראשון, לא העצה.",
    exercise: "בשיחה הבאה עם הילד/ה, במקום לתת פתרון, שקפי: 'נשמע שהיה לך ממש קשה עם זה'. עצרי, ותני מקום.",
    transcript: "הקלטה (טקסט): לפני העצה — ההקשבה. 'אני איתך' עושה יותר מ'תעשה ככה'.",
    reflection: "מה קרה כששיקפת במקום לתקן?", next_step: "parenting-co-regulate", source_ids: ["kb-shita"], sensitivity: "low" }),
  M({ slug: "parenting-co-regulate", topic: "parenting", audience: "parent", sort_order: 2, title: "להירגע יחד", objective: "להבין שילד נרגע דרך הרוגע של ההורה (ויסות משותף).", duration_min: 6,
    explanation: "ילדים לומדים לווסת רגש דרך מערכת העצבים של המבוגר. כשאת רגועה, את מלמדת רוגע — בלי מילים.",
    exercise: "בפעם הבאה שהילד/ה מוצף/ת, קודם הרגיעי את עצמך: נשימה אחת ארוכה. רק אז גשי, בקול נמוך ואיטי.",
    transcript: "הקלטה (טקסט): הרוגע שלך מדבק. קודם את, ואז הם.",
    reflection: "איך השתנתה הסיטואציה כשהתחלת מהרוגע שלך?", next_step: "communication-i-message", source_ids: ["kb-shita"], sensitivity: "low" }),

  // 10) תקשורת
  M({ slug: "communication-i-message", topic: "communication", sort_order: 1, title: "לדבר מ'אני'", objective: "לבטא צורך בלי להאשים — כדי שהצד השני יוכל לשמוע.",
    explanation: "משפט שמתחיל ב'אתה תמיד' מזמין הגנה. משפט שמתחיל ב'אני מרגישה' מזמין הקשבה. אותו תוכן, תוצאה אחרת.",
    exercise: "חשבי על תלונה חוזרת. נסחי אותה מחדש בתבנית: 'אני מרגישה ___ כש___, ואני צריכה ___'.",
    transcript: "הקלטה (טקסט): לא להאשים, לבקש. 'אני מרגישה' פותח דלת ש'אתה תמיד' סוגר.",
    reflection: "איך הרגיש לנסח את זה מ'אני' במקום מ'אתה'?", next_step: "communication-pause", source_ids: ["kb-shita"], sensitivity: "low" }),
  M({ slug: "communication-pause", topic: "communication", sort_order: 2, title: "העצירה שלפני התגובה", objective: "לתרגל שנייה של השהיה כדי להגיב במקום להיסחף.", duration_min: 4,
    explanation: "בין הטריגר לתגובה יש רווח קטן. ככל שמתאמנים לעצור בו לרגע — בוחרים איך להגיב במקום להיסחף.",
    exercise: "כשמשהו מעצבן אותך בשיחה, קחי נשימה אחת שלמה לפני שאת עונה. רק נשימה אחת. שימי לב מה משתנה.",
    transcript: "הקלטה (טקסט): נשימה אחת היא כל ההבדל בין תגובה שבחרת לבין תגובה שנסחפת אליה.",
    reflection: "מתי היום יכולת לעצור לנשימה לפני שהגבת?", next_step: "anxiety-alarm", source_ids: ["kb-shita"], sensitivity: "low" }),
];

function seedContent() {
  let sources = 0, modules = 0;
  const insSrc = db.prepare(
    `INSERT OR IGNORE INTO content_sources
     (source_id, title, creator, url_path, source_type, rights_status, topic, audience, sensitivity, approved_by, approved_at, version, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const s of SOURCES) {
    // approved_by = null → REQUIRES_APPROVAL (קטי מאשרת). status 'review' עד אישור.
    const r = insSrc.run(s.source_id, s.title, "קטי שגב", s.url_path, s.source_type, s.rights_status, s.topic, s.audience, s.sensitivity, null, null, "1.0", "review");
    sources += r.changes || 0;
  }
  const insMod = db.prepare(
    `INSERT OR IGNORE INTO content_modules
     (slug, title, audience, topic, objective, duration_min, format, explanation, exercise, audio_url, transcript, reflection, reward, safety_note, next_step, source_ids, sensitivity, version, status, sort_order, needs_content_review)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );
  for (const m of MODULES) {
    const r = insMod.run(m.slug, m.title, m.audience, m.topic, m.objective, m.duration_min, m.format, m.explanation, m.exercise, m.audio_url, m.transcript, m.reflection, m.reward, m.safety_note, m.next_step, JSON.stringify(m.source_ids || []), m.sensitivity, m.version, m.status, m.sort_order);
    modules += r.changes || 0;
  }
  return { sources, modules, totalSources: SOURCES.length, totalModules: MODULES.length };
}

module.exports = { seedContent, SOURCES, MODULES };
