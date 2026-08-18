import type { Locale } from './config'

/**
 * Kho chuỗi hiển thị.
 *
 * KHOÁ PHẲNG CÓ CHẤM (`nav.dashboard`) chứ không lồng object. Lồng thì đẹp mắt
 * nhưng muốn TypeScript kiểm tra đủ/thiếu phải viết kiểu đệ quy khá rối; khoá
 * phẳng cho ngay `keyof typeof vi`, và hai bản dịch khai là
 * `Record<MessageKey, string>` nên THIẾU MỘT CHUỖI LÀ LỖI BIÊN DỊCH, không phải
 * lỗi phát hiện được lúc chạy khi khách đã nhìn thấy chỗ trống.
 *
 * Tiếng Việt là bản GỐC: sửa chữ thì sửa ở đây trước, hai bản kia bám theo.
 *
 * ===== AI ĐỌC BẢN DỊCH NÀY =====
 *
 * NGƯỜI VIỆT ĐANG HỌC NGOẠI NGỮ, không phải người bản xứ. Đây không phải bản
 * địa hoá để bán ra nước ngoài — đổi sang English/Deutsch là một cách tự đặt
 * mình vào môi trường ngôn ngữ đích trong lúc luyện đề.
 *
 * Điều đó đổi hẳn cách chọn từ, theo ba nguyên tắc:
 *
 *  1. CHUẨN MỰC HƠN LÀ BẢN XỨ. Ưu tiên từ người học gặp trong giáo trình và
 *     trong đề thi. Tránh tiếng lóng, tránh cách nói tắt kiểu người bản xứ, dù
 *     nghe tự nhiên hơn — người đọc đang học, gặp một cụm lạ là mất mạch.
 *  2. NHẤT QUÁN HƠN LÀ PHONG PHÚ. Một khái niệm dùng đúng một từ ở mọi chỗ.
 *     Văn hay thì thích đổi từ cho đỡ lặp; ở đây lặp lại chính là dạy từ.
 *  3. CÂU TRỌN VẸN, ĐÚNG NGỮ PHÁP. Không rút gọn kiểu nhãn giao diện nếu việc
 *     rút gọn làm mất cấu trúc câu đáng học.
 *
 * Tiếng Đức xưng "du" xuyên suốt, không phải "Sie": sản phẩm dành cho học sinh
 * và đây là giọng của mọi ứng dụng học tiếng. Đổi qua lại giữa hai lối xưng hô
 * là lỗi nặng nhất mà người học sẽ nhặt phải.
 *
 * ===== GHI CHÚ DỊCH THUẬT =====
 *
 * Không dịch từng từ. Vài chỗ đã cố ý đi chệch nghĩa đen để câu đọc tự nhiên
 * trong ngôn ngữ đích:
 *
 *  • "Kho đề" -> "Question bank" / "Aufgabenpool". Dịch sát là "exam warehouse",
 *    vô nghĩa trong ngành giáo dục. "Question bank" là thuật ngữ chuẩn.
 *  • "Lịch ôn" -> "Study plan" / "Lernplan". "Revision calendar" đúng chữ nhưng
 *    người dùng Anh ngữ hiểu "study plan" nhanh hơn.
 *  • "Tiện ích" -> "Tools" / "Werkzeuge", không phải "Utilities" — mục này chứa
 *    Pomodoro và trò chơi từ vựng, "Utilities" nghe như phần cài đặt hệ thống.
 *  • "Bài đã làm" -> "Your attempts" / "Deine Versuche". Tiếng Anh chuộng đại từ
 *    sở hữu ở nhãn điều hướng; tiếng Đức dùng "du" vì đây là sản phẩm học tập
 *    cho học sinh, không phải văn bản hành chính.
 *  • "Đăng xuất" -> "Sign out" / "Abmelden". Tiếng Đức phân biệt "Abmelden"
 *    (thoát phiên) với "Austragen" (huỷ đăng ký) — dùng sai là hiểu thành xoá
 *    tài khoản.
 *  • "Dữ liệu cá nhân" -> "Your data" / "Deine Daten", không phải "Personal
 *    data": mục này là nơi tải về và xoá dữ liệu, không phải nơi sửa hồ sơ.
 *  • Tiếng Đức viết hoa danh từ — giữ đúng chính tả, đừng bắt chước kiểu viết
 *    thường của tiếng Anh.
 */
export const vi = {
  /* ---------- Điều hướng & khung ---------- */
  'nav.dashboard': 'Tổng quan',
  'nav.exams': 'Kho đề',
  'nav.schedule': 'Lịch ôn',
  'nav.stats': 'Thống kê',
  'nav.tools': 'Tiện ích',
  'nav.settings': 'Cài đặt',
  'nav.aria.main': 'Điều hướng chính',
  'nav.aria.home': 'Nerdy Hub — trang chủ',

  /* ---------- Cụm nút góc phải ---------- */
  'header.notifications': 'Thông báo',
  'header.account': 'Tài khoản',

  /* ---------- Menu tài khoản ---------- */
  'account.fallbackName': 'Tài khoản',
  'account.data': 'Dữ liệu cá nhân',
  'account.signOut': 'Đăng xuất',
  'account.signOutPending': 'Đang thoát…',
  'account.guardianPending': 'Đang chờ xác nhận của người giám hộ.',
  'account.guardianTitle': 'Chờ xác nhận của người giám hộ',

  /* ---------- Đổi ngôn ngữ ---------- */
  'locale.label': 'Ngôn ngữ',
  'locale.aria': 'Chọn ngôn ngữ hiển thị',

  /* ---------- Đăng nhập ở góc phải trang giới thiệu ---------- */
  'auth.signIn': 'Đăng nhập',
  'auth.enterApp': 'Vào ứng dụng với tài khoản {name}',

  /* ---------- Biểu mẫu chung ---------- */
  'form.required': 'Bắt buộc',
  'form.pending': 'Đang xử lý…',
  'form.or': 'hoặc',

  /* ---------- Đăng nhập ---------- */
  'login.title': 'Đăng nhập',
  'login.subtitle': 'Tiếp tục theo dõi tiến độ và điểm số của bạn.',
  'login.submit': 'Đăng nhập',
  'login.google': 'Đăng nhập bằng Google',
  'login.noAccount': 'Chưa có tài khoản?',
  'login.toRegister': 'Đăng ký',
  'login.staleSession':
    'Phiên đăng nhập cũ không còn hiệu lực vì tài khoản gắn với nó đã bị xoá. Bạn đăng nhập lại giúp nhé.',

  /* ---------- Đăng ký ---------- */
  'register.title': 'Tạo tài khoản',
  'register.subtitle':
    'Tạo tài khoản để lưu tiến độ luyện đề và theo dõi điểm số qua thời gian.',
  'register.submit': 'Tạo tài khoản',
  'register.google': 'Đăng ký bằng Google',

  /* ---------- Ô nhập ---------- */
  'field.email': 'Email',
  'field.password': 'Mật khẩu',
  'field.passwordHint': 'Tối thiểu 8 ký tự',
  'field.name': 'Tên của bạn',
  'field.namePlaceholder': 'Nguyễn Văn A',
  'field.guardianEmail': 'Email cha mẹ / người giám hộ',

  /* ---------- Tổng quan ---------- */
  'dashboard.greeting': 'Chào {name} 👋',
  'dashboard.greetingGuest': 'Chào bạn 👋',
  'dashboard.titleContinue': 'Hôm nay luyện tiếp nhé!',
  'dashboard.titleStart': 'Bắt đầu đề đầu tiên nào!',
  'dashboard.doneCount': '{count} đề đã xong',

  /* ---------- Cài đặt ---------- */
  'settings.title': 'Cài đặt',
  'settings.subtitle': 'Tài khoản và quyền riêng tư theo Nghị định 13/2023/NĐ-CP.',
  'settings.consentTitle': 'Sự đồng ý theo từng mục đích',
  'settings.consent.service': 'Vận hành dịch vụ',
  'settings.consent.serviceDesc':
    'Lưu bài làm, chấm điểm, khôi phục phiên thi. Bắt buộc để dùng được sản phẩm.',
  'settings.consent.marketing': 'Email tiếp thị',
  'settings.consent.marketingDesc': 'Nhận thông báo về đề mới và tính năng mới.',
  'settings.consent.analytics': 'Phân tích sử dụng',
  'settings.consent.analyticsDesc':
    'Thống kê ẩn danh giúp cải thiện chất lượng đề và trải nghiệm phòng thi.',
  'settings.consent.leaderboard': 'Hiện tên trên bảng xếp hạng',
  'settings.consent.leaderboardDesc':
    'Cho phép hiển thị tên bạn công khai khi so sánh thành tích.',
  'settings.calendar': 'Kết nối Google Calendar',
  'settings.calendarDesc': 'Tạo lịch ôn riêng trong tài khoản Google của bạn.',
  'settings.rightsTitle': 'Quyền của bạn',
  'settings.rights.export': 'Xuất toàn bộ dữ liệu cá nhân dạng JSON',
  'settings.rights.delete': 'Xoá tài khoản: ẩn ngay, xoá hẳn sau 48 giờ',
  'settings.guestNotice':
    'Bạn đang dùng ở chế độ khách. Bài làm gắn với một cookie phiên trong trình duyệt này, không gắn với danh tính cá nhân nào.',
  'settings.accountNotice':
    'Bài làm của bạn được lưu vào tài khoản này, không phụ thuộc trình duyệt đang dùng.',

  /* ---------- Widget chung ---------- */
  'widget.moreOptions': 'Tuỳ chọn khác',
  'widget.filter': 'Bộ lọc',

  /* ---------- Tiến độ luyện đề ---------- */
  'progress.title': 'Tiến độ luyện đề',
  'progress.remaining': '+{count} đề',
  'progress.empty': 'Chưa có kỳ thi nào được công bố.',
  'progress.prev': 'Xem thẻ trước',
  'progress.next': 'Xem thẻ sau',
  'progress.papers': '{count} đề',
  'progress.avg': 'TB {percent}%',
  'progress.doneOf': '{done}/{total} đề',
  'progress.start': 'Bắt đầu',
  'progress.continue': 'Làm tiếp bài dở',
  'progress.nextPaper': 'Làm đề tiếp theo',
  'progress.optionsFor': 'Tuỳ chọn cho {name}',

  /* ---------- Giờ luyện tập ---------- */
  'hours.title': 'Giờ luyện tập',

  /* ---------- Lịch tháng ---------- */
  'calendar.title': 'Lịch',
  'calendar.prevMonth': 'Tháng trước',
  'calendar.nextMonth': 'Tháng sau',
  'calendar.hasPractice': 'Có luyện đề',

  /* ---------- Lịch ôn ---------- */
  'schedule.title': 'Lịch ôn',
  'schedule.recent': 'Các buổi ôn gần đây',
  'schedule.add': 'Thêm buổi ôn',
  'schedule.empty': 'Chưa có buổi ôn nào trong 6 ngày qua.',

  /* ---------- Việc hôm nay ---------- */
  'tasks.title': 'Việc hôm nay',
  'tasks.prompt': 'Hôm nay bạn muốn làm gì?',
  'tasks.placeholder': 'Thêm một việc…',
  'tasks.add': 'Thêm việc',
  'tasks.addToday': 'Thêm việc cho hôm nay',

  /* ---------- Tiện ích ---------- */
  'tools.title': 'Tiện ích',
  'tools.pomodoro': 'Pomodoro',
  'tools.pomodoroDesc': '25 phút tập trung, 5 phút nghỉ.',
  'tools.wordle': 'Wordle từ vựng',
  'tools.wordleDesc': 'Đoán từ 5 chữ trong 6 lượt.',
  'tools.moreOrLess': 'More or Less',
  'tools.moreOrLessDesc': 'Đoán xem bên nào hơn.',

  /* ---------- Tên ngôn ngữ của kỳ thi ---------- */
  'lang.EN': 'Tiếng Anh',
  'lang.KO': 'Tiếng Hàn',
  'lang.JA': 'Tiếng Nhật',
  'lang.ZH': 'Tiếng Trung',
  'lang.DE': 'Tiếng Đức',
  'lang.VI': 'Tiếng Việt',

  /* ---------- Giờ luyện tập (phần còn lại) ---------- */
  'hours.range': '6 ngày',
  'hours.empty': 'Làm một đề để bắt đầu đếm giờ luyện tập.',

  /* ---------- Việc hôm nay (phần còn lại) ---------- */
  'tasks.hint':
    'Ghi ra vài việc nhỏ và cụ thể — kiểu “làm 1 đề Nghe VSTEP” — rồi tick khi xong.',

  /* ---------- Tiện ích: trang và thẻ giới thiệu ---------- */
  'tools.openTab': 'Mở tab Tiện ích',
  'tools.pageSubtitle':
    'Vài thứ nhỏ dùng kèm lúc ôn. Mở ra khi cần, đóng lại khi xong.',
  'tools.sectionTitle': 'Dụng cụ đi kèm',

  /* ---------- Trang Tiện ích ---------- */
  'toolsPage.pomodoroDesc':
    'Đồng hồ tập trung 25 phút, nghỉ 5 phút, cứ 4 phiên thì nghỉ dài 15 phút. Chạy tiếp kể cả khi bạn chuyển tab hoặc tải lại trang.',
  'toolsPage.pomodoroOpen': 'Mở Pomodoro',
  'toolsPage.moreOrLessDesc':
    'Game đoán xem bên nào nhiều hơn — dân số, diện tích, GDP, nghệ sĩ Việt. Chơi nhanh trong một phút nghỉ Pomodoro rồi quay lại làm bài.',
  'toolsPage.moreOrLessOpen': 'Mở More or Less',
  'toolsPage.wordleDesc':
    'Đoán từ tiếng Anh 5 chữ cái — mỗi ngày một từ chung cho mọi người, kèm nghĩa tiếng Việt sau khi xong. Có chế độ luyện tập vô hạn.',
  'toolsPage.wordleOpen': 'Mở Wordle',
} as const

export type MessageKey = keyof typeof vi

export const en: Record<MessageKey, string> = {
  'nav.dashboard': 'Overview',
  'nav.exams': 'Question bank',
  'nav.schedule': 'Study plan',
  'nav.stats': 'Statistics',
  'nav.tools': 'Tools',
  'nav.settings': 'Settings',
  'nav.aria.main': 'Main navigation',
  'nav.aria.home': 'Nerdy Hub — home',

  'header.notifications': 'Notifications',
  'header.account': 'Account',

  'account.fallbackName': 'Account',
  'account.data': 'Your data',
  'account.signOut': 'Sign out',
  'account.signOutPending': 'Signing out…',
  'account.guardianPending': 'Waiting for a guardian to confirm.',
  'account.guardianTitle': 'Waiting for guardian confirmation',

  'locale.label': 'Language',
  'locale.aria': 'Choose display language',

  'auth.signIn': 'Sign in',
  'auth.enterApp': 'Open the app as {name}',

  'form.required': 'Required',
  'form.pending': 'Please wait…',
  'form.or': 'or',

  'login.title': 'Sign in',
  'login.subtitle': 'Continue tracking your progress and your scores.',
  'login.submit': 'Sign in',
  'login.google': 'Sign in with Google',
  'login.noAccount': 'Do not have an account yet?',
  'login.toRegister': 'Create one',
  'login.staleSession':
    'Your previous session is no longer valid, because the account it belonged to has been deleted. Please sign in again.',

  'register.title': 'Create an account',
  'register.subtitle':
    'Create an account to save your practice progress and follow your scores over time.',
  'register.submit': 'Create an account',
  'register.google': 'Sign up with Google',

  'field.email': 'Email',
  'field.password': 'Password',
  'field.passwordHint': 'At least 8 characters',
  'field.name': 'Your name',
  'field.namePlaceholder': 'Alex Nguyen',
  'field.guardianEmail': 'Parent or guardian email',

  'dashboard.greeting': 'Hello {name} 👋',
  'dashboard.greetingGuest': 'Hello there 👋',
  'dashboard.titleContinue': 'Time to keep practising!',
  'dashboard.titleStart': 'Let us start your first paper!',
  'dashboard.doneCount': '{count} papers finished',

  'settings.title': 'Settings',
  'settings.subtitle': 'Your account and privacy, under Decree 13/2023/ND-CP.',
  'settings.consentTitle': 'Consent, purpose by purpose',
  'settings.consent.service': 'Running the service',
  'settings.consent.serviceDesc':
    'Saving your answers, marking them, and restoring an interrupted exam. Required in order to use the product.',
  'settings.consent.marketing': 'Marketing email',
  'settings.consent.marketingDesc': 'Receive news about new papers and new features.',
  'settings.consent.analytics': 'Usage analytics',
  'settings.consent.analyticsDesc':
    'Anonymous statistics that help us improve the papers and the exam room.',
  'settings.consent.leaderboard': 'Show my name on the leaderboard',
  'settings.consent.leaderboardDesc':
    'Allow your name to be shown publicly when results are compared.',
  'settings.calendar': 'Connect Google Calendar',
  'settings.calendarDesc': 'Create your own study schedule inside your Google account.',
  'settings.rightsTitle': 'Your rights',
  'settings.rights.export': 'Export all of your personal data as JSON',
  'settings.rights.delete': 'Delete your account: hidden at once, erased after 48 hours',
  'settings.guestNotice':
    'You are using guest mode. Your answers are tied to a session cookie in this browser, not to any personal identity.',
  'settings.accountNotice':
    'Your answers are saved to this account, so they do not depend on the browser you are using.',

  'widget.moreOptions': 'More options',
  'widget.filter': 'Filter',

  'progress.title': 'Practice progress',
  'progress.remaining': '+{count} papers',
  'progress.empty': 'No exam has been published yet.',
  'progress.prev': 'Previous card',
  'progress.next': 'Next card',
  'progress.papers': '{count} papers',
  'progress.avg': 'Avg {percent}%',
  'progress.doneOf': '{done} of {total} papers',
  'progress.start': 'Start',
  'progress.continue': 'Continue your paper',
  'progress.nextPaper': 'Next paper',
  'progress.optionsFor': 'Options for {name}',

  'hours.title': 'Practice hours',

  'calendar.title': 'Calendar',
  'calendar.prevMonth': 'Previous month',
  'calendar.nextMonth': 'Next month',
  'calendar.hasPractice': 'Practised',

  'schedule.title': 'Study plan',
  'schedule.recent': 'Recent study sessions',
  'schedule.add': 'Add a session',
  'schedule.empty': 'No study session in the past 6 days.',

  'tasks.title': 'Today’s tasks',
  'tasks.prompt': 'What would you like to do today?',
  'tasks.placeholder': 'Add a task…',
  'tasks.add': 'Add task',
  'tasks.addToday': 'Add a task for today',

  'tools.title': 'Tools',
  'tools.pomodoro': 'Pomodoro',
  'tools.pomodoroDesc': '25 minutes of focus, then a 5 minute break.',
  'tools.wordle': 'Vocabulary Wordle',
  'tools.wordleDesc': 'Guess the five letter word in six tries.',
  'tools.moreOrLess': 'More or Less',
  'tools.moreOrLessDesc': 'Guess which side is greater.',

  'lang.EN': 'English',
  'lang.KO': 'Korean',
  'lang.JA': 'Japanese',
  'lang.ZH': 'Chinese',
  'lang.DE': 'German',
  'lang.VI': 'Vietnamese',

  'hours.range': '6 days',
  'hours.empty': 'Finish a paper to start counting your practice hours.',

  'tasks.hint':
    'Write down a few small, concrete tasks — such as “do one VSTEP listening paper” — then tick them off.',

  'tools.openTab': 'Open the Tools tab',
  'tools.pageSubtitle':
    'A few small things to use while you study. Open one when you need it, close it when you are done.',
  'tools.sectionTitle': 'Study aids',

  'toolsPage.pomodoroDesc':
    'A timer for 25 minutes of focus and a 5 minute break, with a longer 15 minute break after every fourth session. It keeps running even if you switch tabs or reload the page.',
  'toolsPage.pomodoroOpen': 'Open Pomodoro',
  'toolsPage.moreOrLessDesc':
    'A game where you guess which side is greater — population, area, GDP, Vietnamese artists. Play a quick round during a Pomodoro break, then go back to your paper.',
  'toolsPage.moreOrLessOpen': 'Open More or Less',
  'toolsPage.wordleDesc':
    'Guess a five letter English word. Everyone gets the same word each day, and the Vietnamese meaning is shown once you finish. There is also an unlimited practice mode.',
  'toolsPage.wordleOpen': 'Open Wordle',
}

export const de: Record<MessageKey, string> = {
  'nav.dashboard': 'Übersicht',
  'nav.exams': 'Aufgabenpool',
  'nav.schedule': 'Lernplan',
  'nav.stats': 'Statistik',
  'nav.tools': 'Werkzeuge',
  'nav.settings': 'Einstellungen',
  'nav.aria.main': 'Hauptnavigation',
  'nav.aria.home': 'Nerdy Hub — Startseite',

  'header.notifications': 'Benachrichtigungen',
  'header.account': 'Konto',

  'account.fallbackName': 'Konto',
  'account.data': 'Deine Daten',
  'account.signOut': 'Abmelden',
  'account.signOutPending': 'Wird abgemeldet…',
  'account.guardianPending': 'Warten auf die Bestätigung durch eine Aufsichtsperson.',
  'account.guardianTitle': 'Warten auf Bestätigung der Aufsichtsperson',

  'locale.label': 'Sprache',
  'locale.aria': 'Anzeigesprache wählen',

  'auth.signIn': 'Anmelden',
  'auth.enterApp': 'App als {name} öffnen',

  'form.required': 'Pflichtfeld',
  'form.pending': 'Bitte warten…',
  'form.or': 'oder',

  'login.title': 'Anmelden',
  'login.subtitle': 'Verfolge deinen Fortschritt und deine Ergebnisse weiter.',
  'login.submit': 'Anmelden',
  'login.google': 'Mit Google anmelden',
  'login.noAccount': 'Hast du noch kein Konto?',
  'login.toRegister': 'Konto erstellen',
  'login.staleSession':
    'Deine frühere Sitzung ist nicht mehr gültig, weil das zugehörige Konto gelöscht wurde. Bitte melde dich erneut an.',

  'register.title': 'Konto erstellen',
  'register.subtitle':
    'Erstelle ein Konto, um deinen Übungsfortschritt zu speichern und deine Ergebnisse über die Zeit zu verfolgen.',
  'register.submit': 'Konto erstellen',
  'register.google': 'Mit Google registrieren',

  'field.email': 'E-Mail',
  'field.password': 'Passwort',
  'field.passwordHint': 'Mindestens 8 Zeichen',
  'field.name': 'Dein Name',
  'field.namePlaceholder': 'Alex Nguyen',
  'field.guardianEmail': 'E-Mail eines Elternteils oder Erziehungsberechtigten',

  'dashboard.greeting': 'Hallo {name} 👋',
  'dashboard.greetingGuest': 'Hallo 👋',
  'dashboard.titleContinue': 'Zeit zum Weiterüben!',
  'dashboard.titleStart': 'Beginnen wir mit deinem ersten Testsatz!',
  'dashboard.doneCount': '{count} Testsätze abgeschlossen',

  'settings.title': 'Einstellungen',
  'settings.subtitle': 'Dein Konto und dein Datenschutz nach Dekret 13/2023/ND-CP.',
  'settings.consentTitle': 'Einwilligung nach Zweck',
  'settings.consent.service': 'Betrieb des Dienstes',
  'settings.consent.serviceDesc':
    'Deine Antworten speichern, bewerten und eine unterbrochene Prüfung wiederherstellen. Für die Nutzung des Produkts erforderlich.',
  'settings.consent.marketing': 'Werbe-E-Mails',
  'settings.consent.marketingDesc':
    'Erhalte Nachrichten über neue Testsätze und neue Funktionen.',
  'settings.consent.analytics': 'Nutzungsanalyse',
  'settings.consent.analyticsDesc':
    'Anonyme Statistiken, die uns helfen, die Testsätze und den Prüfungsraum zu verbessern.',
  'settings.consent.leaderboard': 'Meinen Namen in der Bestenliste zeigen',
  'settings.consent.leaderboardDesc':
    'Erlaube, dass dein Name öffentlich erscheint, wenn Ergebnisse verglichen werden.',
  'settings.calendar': 'Google Kalender verbinden',
  'settings.calendarDesc': 'Erstelle deinen eigenen Lernplan in deinem Google Konto.',
  'settings.rightsTitle': 'Deine Rechte',
  'settings.rights.export': 'Alle deine personenbezogenen Daten als JSON exportieren',
  'settings.rights.delete':
    'Konto löschen: sofort verborgen, nach 48 Stunden endgültig gelöscht',
  'settings.guestNotice':
    'Du nutzt den Gastmodus. Deine Antworten sind an ein Sitzungscookie in diesem Browser gebunden, nicht an eine persönliche Identität.',
  'settings.accountNotice':
    'Deine Antworten werden in diesem Konto gespeichert und hängen daher nicht vom verwendeten Browser ab.',

  'widget.moreOptions': 'Weitere Optionen',
  'widget.filter': 'Filter',

  'progress.title': 'Übungsfortschritt',
  'progress.remaining': '+{count} Testsätze',
  'progress.empty': 'Es wurde noch keine Prüfung veröffentlicht.',
  'progress.prev': 'Vorherige Karte',
  'progress.next': 'Nächste Karte',
  'progress.papers': '{count} Testsätze',
  'progress.avg': 'Durchschnitt {percent}%',
  'progress.doneOf': '{done} von {total} Testsätzen',
  'progress.start': 'Beginnen',
  'progress.continue': 'Testsatz fortsetzen',
  'progress.nextPaper': 'Nächster Testsatz',
  'progress.optionsFor': 'Optionen für {name}',

  'hours.title': 'Übungsstunden',

  'calendar.title': 'Kalender',
  'calendar.prevMonth': 'Voriger Monat',
  'calendar.nextMonth': 'Nächster Monat',
  'calendar.hasPractice': 'Geübt',

  'schedule.title': 'Lernplan',
  'schedule.recent': 'Letzte Lerneinheiten',
  'schedule.add': 'Lerneinheit hinzufügen',
  'schedule.empty': 'In den letzten 6 Tagen keine Lerneinheit.',

  'tasks.title': 'Aufgaben für heute',
  'tasks.prompt': 'Was möchtest du heute machen?',
  'tasks.placeholder': 'Eine Aufgabe hinzufügen…',
  'tasks.add': 'Aufgabe hinzufügen',
  'tasks.addToday': 'Eine Aufgabe für heute hinzufügen',

  'tools.title': 'Werkzeuge',
  'tools.pomodoro': 'Pomodoro',
  'tools.pomodoroDesc': '25 Minuten Konzentration, dann 5 Minuten Pause.',
  'tools.wordle': 'Vokabel-Wordle',
  'tools.wordleDesc': 'Errate das Wort aus fünf Buchstaben in sechs Versuchen.',
  'tools.moreOrLess': 'More or Less',
  'tools.moreOrLessDesc': 'Errate, welche Seite größer ist.',

  'lang.EN': 'Englisch',
  'lang.KO': 'Koreanisch',
  'lang.JA': 'Japanisch',
  'lang.ZH': 'Chinesisch',
  'lang.DE': 'Deutsch',
  'lang.VI': 'Vietnamesisch',

  'hours.range': '6 Tage',
  'hours.empty': 'Schließe einen Testsatz ab, um deine Übungsstunden zu zählen.',

  'tasks.hint':
    'Schreibe ein paar kleine, konkrete Aufgaben auf — zum Beispiel „einen VSTEP-Hörtest machen“ — und hake sie danach ab.',

  'tools.openTab': 'Den Werkzeuge-Tab öffnen',
  'tools.pageSubtitle':
    'Ein paar kleine Helfer zum Lernen. Öffne sie, wenn du sie brauchst, und schließe sie danach wieder.',
  'tools.sectionTitle': 'Lernhilfen',

  'toolsPage.pomodoroDesc':
    'Ein Timer für 25 Minuten Konzentration und 5 Minuten Pause, nach jeder vierten Einheit eine längere Pause von 15 Minuten. Er läuft weiter, auch wenn du den Tab wechselst oder die Seite neu lädst.',
  'toolsPage.pomodoroOpen': 'Pomodoro öffnen',
  'toolsPage.moreOrLessDesc':
    'Ein Spiel, bei dem du errätst, welche Seite größer ist — Bevölkerung, Fläche, BIP, vietnamesische Künstler. Spiele eine schnelle Runde in einer Pomodoro-Pause und mache danach weiter.',
  'toolsPage.moreOrLessOpen': 'More or Less öffnen',
  'toolsPage.wordleDesc':
    'Errate ein englisches Wort aus fünf Buchstaben. Alle bekommen täglich dasselbe Wort, und am Ende siehst du die vietnamesische Bedeutung. Es gibt auch einen unbegrenzten Übungsmodus.',
  'toolsPage.wordleOpen': 'Wordle öffnen',
}

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { vi, en, de }

/**
 * Thay chỗ trống `{ten}` bằng giá trị thật.
 *
 * Cố ý KHÔNG dùng thư viện định dạng đầy đủ (ICU MessageFormat): chỗ nào cần
 * chia số ít/số nhiều thì tách hẳn thành hai khoá, dễ đọc hơn cú pháp lồng và
 * không kéo thêm phụ thuộc. Tiếng Đức còn có cách (Kasus) mà ICU cũng không lo
 * được — vẫn phải viết tay từng câu.
 */
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  )
}
