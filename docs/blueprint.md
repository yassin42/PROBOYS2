# **App Name**: ProBoys Manager

## Core Features:

- Offline-First Inventory Management: View, add, edit, and adjust stock levels (with alerts) for phone models, parts, pricing, and costs. Data is synchronized across devices with local persistence for offline access using Firestore and IndexedDB.
- Dashboard & Global Search: A brand-centric home dashboard with a bento-grid layout for key categories and a persistent global search bar for rapid item lookup and filtering across all inventory.
- Sales & Transaction Logging: Log sales transactions, automatically update inventory stock, calculate gross profit margins, and maintain a timestamped historical sales record in a local database.
- Intelligent Cross-Compatibility Suggestions: An AI tool that can suggest or elaborate on cross-compatibility notes for parts and models based on available product data and inventory intelligence.
- Camera Barcode Scanner: Utilize the device's camera to scan QR codes or barcodes, instantly navigating the UI to the corresponding inventory item's sheet for quick management.
- Real-Time Team Communication: A real-time messaging module for lab technicians and front-desk agents, featuring auto-scrolling to new messages for seamless internal communication.
- Label Generation: Generate customized 50mm x 30mm product labels with dynamic content including model, category, price, and auto-generated Code 128 barcodes, ready for printing.

## Style Guidelines:

- Color scheme: Dark theme, with a deep background (`#16121D`) providing a robust and high-contrast canvas for professional inventory management.
- Primary accent color: Muted violet-blue (`#8066E6`) for interactive elements and primary highlights, conveying an enterprise-grade and refined feel.
- Secondary accent color: A brighter, clear sky blue (`#8BC0FC`) for emphasizing cross-compatibility notes and critical notifications, ensuring visibility against the dark palette.
- Headings and general body text: 'Inter' (sans-serif), chosen for its elegant, contemporary appearance and high legibility across various screen sizes. Note: currently only Google Fonts are supported.
- Numerical data, stock thresholds, and live hardware logs: 'JetBrains Mono' (monospace), ensuring precise alignment and clear legibility for all technical and quantitative information. Note: currently only Google Fonts are supported.
- Employ crisp, minimalist line-based icons to complement the high-contrast dark theme, focusing on clarity and functionality.
- Dashboard layout: A clean bento-grid structure presenting key phone brands and a universal accessories tile. Inventory sheets feature a customizable and easily editable category-based layout.
- Scrolling: Implement smooth, infinite vertical touch scrolling for all lists, grids, category views, and panels to ensure a fluid user experience.
- Interactive feedback: Incorporate subtle micro-transitions and tactile card animations, powered by dynamic state handlers, to provide immediate and responsive feedback to user touch inputs.