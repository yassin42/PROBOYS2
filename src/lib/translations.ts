export type Language = 'en' | 'ar';

export function formatCurrency(amount: number, lang: Language): string {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(num);

  if (lang === 'ar') {
    return `${formatted} د.ج`;
  }
  return `${formatted} DZD`;
}

export const translations = {
  en: {
    // Header & Nav
    appName: 'PROBOYS',
    tagline: 'Repair shop control',
    home: 'Home',
    inventory: 'Inventory',
    repairs: 'Repairs',
    statistics: 'Statistics',
    newItem: 'New item',
    toggleSound: 'Toggle sound',

    // Search & Filters
    shopSubtitle: 'ProBoys repair shop',
    searchTitle: 'Search inventory',
    searchDesc: 'Search by model, part name, barcode, QR code, or item ID.',
    searchPlaceholder: 'Search model, part, code...',
    scanCode: 'Scan barcode / QR',
    repairBoardNav: 'Repair board',
    allBrands: 'All brands',
    itemsCount: 'items',
    noItemsFound: 'No parts match these filters.',

    // Categories
    catAll: 'All',
    catScreens: 'Screens',
    catBatteries: 'Batteries',
    catChargingPorts: 'Charging ports',
    catBackGlass: 'Back glass',
    catCameraGlass: 'Camera glass',
    catCameras: 'Cameras',
    catAccessories: 'Accessories',
    catHardware: 'Hardware',
    catTools: 'Tools',
    catOther: 'Other',

    // Item Card
    inStock: 'in stock',
    outOfStock: 'Out of stock',
    sticker: 'Sticker',
    receipt: 'Receipt',
    edit: 'Edit',
    delete: 'Delete',
    confirmDeleteTitle: 'Delete inventory item',
    confirmDeleteText: 'Are you sure you want to delete this item? This action cannot be undone.',
    cancel: 'Cancel',

    // Editor Modal
    editItemTitle: 'Edit inventory item',
    newItemTitle: 'Add inventory item',
    itemName: 'Item name',
    itemNamePlaceholder: 'e.g. iPhone 13 screen',
    barcode: 'Barcode / code',
    barcodePlaceholder: 'Scan or enter code',
    category: 'Category',
    brand: 'Brand',
    model: 'Model',
    stockQty: 'Stock quantity',
    buyCost: 'Buy cost',
    sellingPrice: 'Selling price',
    profitMargin: 'Margin',
    compatibleModels: 'Compatible models',
    compatibleModelsPlaceholder: 'e.g. Galaxy A24, Galaxy A25 (comma separated)',
    saveChanges: 'Save changes',
    addItemBtn: 'Add item',

    // Repair Board
    serviceWorkflow: 'Service workflow',
    repairBoardTitle: 'Repair board',
    repairBoardDesc: 'Manage device intakes, intake stickers, active repairs, and repair history.',
    activeRepairsTab: 'Active Repairs',
    repairHistoryTab: 'Repair History',
    newRepairJob: 'New Repair Job',
    customerName: 'Customer name',
    customerPhone: 'Phone number',
    deviceModel: 'Device / model',
    issue: 'Issue / Fault',
    expectedPrice: 'Expected price',
    promisedDate: 'Promised date / time',
    notes: 'Notes / Details',
    addRepairBtn: 'Add repair',
    searchRepairsPlaceholder: 'Search repairs by customer, device, phone, or QR code...',
    noActiveRepairs: 'No active repair jobs in queue.',
    noRepairHistory: 'No completed repairs in history yet.',
    
    // Repair Statuses
    statusReceived: 'Received',
    statusInProgress: 'In Progress',
    statusRepaired: 'Repaired',
    statusCollected: 'Collected',

    // Repair Actions
    printIntakeSticker: 'Intake Sticker',
    markAsRepaired: 'Mark as Repaired',
    printFinalReceipt: 'Print Receipt',
    repairedOn: 'Repaired on',
    receivedOn: 'Received on',

    // Statistics
    businessOverview: 'Business overview',
    statisticsTitle: 'Statistics',
    merchandiseMargin: 'Merchandise margin',
    repairProfit: 'Repair profit',
    combinedProfit: 'Combined profit',
    totalStockCount: 'Total items in stock',
    activeRepairsCount: 'Active repairs in shop',
    statsDesc: 'Merchandise margin uses selling price minus buy cost. Repair profit calculates completed repair values in Algerian Dinars (DZD).',

    // Print Labels
    proboysRepair: 'PROBOYS REPAIR',
    intakeTicket: 'INTAKE TICKET',
    finalReceipt: 'FINAL REPAIR RECEIPT',
    phoneLabel: 'Phone',
    dateLabel: 'Date',
    thankYou: 'Thank you for choosing ProBoys!',
    warrantyNotice: '15-Day Repair Warranty included. Present ticket upon collection.',
  },
  ar: {
    // Header & Nav
    appName: 'PROBOYS',
    tagline: 'لوحة تحكم ورشة الصيانة',
    home: 'الرئيسية',
    inventory: 'المخزون',
    repairs: 'الصيانة',
    statistics: 'الإحصائيات',
    newItem: 'قطعة جديدة',
    toggleSound: 'تغيير الصوت',

    // Search & Filters
    shopSubtitle: 'ورشة PROBOYS للصيانة',
    searchTitle: 'البحث في المخزون',
    searchDesc: 'ابحث حسب الطراز، اسم القطعة، الباركود، رمز QR أو رمز القطعة.',
    searchPlaceholder: 'ابحث عن طراز، قطعة، كود...',
    scanCode: 'مسح الباركود / QR',
    repairBoardNav: 'لوحة الصيانة',
    allBrands: 'كل الماركات',
    itemsCount: 'قطعة',
    noItemsFound: 'لا توجد قطع تطابق هذه الفلاتر.',

    // Categories
    catAll: 'الكل',
    catScreens: 'الشاشات',
    catBatteries: 'البطاريات',
    catChargingPorts: 'منافذ الشحن',
    catBackGlass: 'الزجاج الخلفي',
    catCameraGlass: 'زجاج الكاميرا',
    catCameras: 'الكاميرات',
    catAccessories: 'الإكسسوارات',
    catHardware: 'العتاد',
    catTools: 'الأدوات',
    catOther: 'أخرى',

    // Item Card
    inStock: 'في المخزون',
    outOfStock: 'نفذت الكمية',
    sticker: 'ملصق',
    receipt: 'وصل',
    edit: 'تعديل',
    delete: 'حذف',
    confirmDeleteTitle: 'حذف قطعة من المخزون',
    confirmDeleteText: 'هل أنت تأكد من رغبتك في حذف هذه القطعة؟ لا يمكن التراجع عن هذا الإجراء.',
    cancel: 'إلغاء',

    // Editor Modal
    editItemTitle: 'تعديل قطعة في المخزون',
    newItemTitle: 'إضافة قطعة جديدة',
    itemName: 'اسم القطعة',
    itemNamePlaceholder: 'مثال: iPhone 13 screen',
    barcode: 'الباركود / الكود',
    barcodePlaceholder: 'امسح أو أدخل الكود',
    category: 'الفئة',
    brand: 'الماركة',
    model: 'الطراز',
    stockQty: 'الكمية في المخزون',
    buyCost: 'سعر الشراء',
    sellingPrice: 'سعر البيع',
    profitMargin: 'الهامش',
    compatibleModels: 'الطرازات المتوافقة',
    compatibleModelsPlaceholder: 'مثال: Galaxy A24, Galaxy A25 (مفصولة بفاصلة)',
    saveChanges: 'حفظ التغييرات',
    addItemBtn: 'إضافة القطعة',

    // Repair Board
    serviceWorkflow: 'مسار الخدمة والصيانة',
    repairBoardTitle: 'لوحة الصيانة',
    repairBoardDesc: 'إدارة أجهزة الصيانة، طباعة ملصقات الاستلام، ومتابعة الأجهزة النشطة والأرشيف.',
    activeRepairsTab: 'الصيانة الحالية',
    repairHistoryTab: 'أرشيف الصيانة',
    newRepairJob: 'إضافة جهاز صيانة جديد',
    customerName: 'اسم الزبون',
    customerPhone: 'رقم الهاتف',
    deviceModel: 'الجهاز / الطراز',
    issue: 'العطل / المشكلة',
    expectedPrice: 'السعر المتوقع',
    promisedDate: 'تاريخ التسليم المتوقع',
    notes: 'ملاحظات إضافية',
    addRepairBtn: 'تسجيل الصيانة',
    searchRepairsPlaceholder: 'ابحث عن صيانة بالاسم، الهاتف، الجهاز، أو كود QR...',
    noActiveRepairs: 'لا توجد أجهزة قيد الصيانة حالياً.',
    noRepairHistory: 'لا يوجد أرشيف صيانة مكتملة بعد.',

    // Repair Statuses
    statusReceived: 'تم الاستلام',
    statusInProgress: 'قيد الإصلاح',
    statusRepaired: 'تم الإصلاح',
    statusCollected: 'تم التسليم',

    // Repair Actions
    printIntakeSticker: 'ملصق الاستلام',
    markAsRepaired: 'إتمام الإصلاح',
    printFinalReceipt: 'طباعة الوصل',
    repairedOn: 'تاريخ الإصلاح',
    receivedOn: 'تاريخ الاستلام',

    // Statistics
    businessOverview: 'نظرة عامة على النشاط',
    statisticsTitle: 'الإحصائيات',
    merchandiseMargin: 'هامش أرباح المخزون',
    repairProfit: 'أرباح الصيانة',
    combinedProfit: 'إجمالي الأرباح',
    totalStockCount: 'إجمالي القطع بالمخزون',
    activeRepairsCount: 'أجهزة قيد الصيانة بالورشة',
    statsDesc: 'يحسب هامش البضاعة الفرق بين سعر البيع والشراء. بينما تحسب أرباح الصيانة إجمالي قيمة أجهزة الصيانة المكتملة بالدينار الجزائري (د.ج).',

    // Print Labels
    proboysRepair: 'PROBOYS REPAIR',
    intakeTicket: 'وصل استلام جهاز',
    finalReceipt: 'فاتورة تسليم صيانة',
    phoneLabel: 'الهاتف',
    dateLabel: 'التاريخ',
    thankYou: 'شكراً لثقتكم في ProBoys!',
    warrantyNotice: 'ضمان الصيانة 15 يوماً. يرجى إحضار هذا الوصل عند استلام الجهاز.',
  },
};
