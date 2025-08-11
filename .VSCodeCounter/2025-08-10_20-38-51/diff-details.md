# Diff Details

Date : 2025-08-10 20:38:51

Directory /home/whitebow/Documents/dev/encheres-project/backend

Total : 83 files,  -3251 codes, 33 comments, -413 blanks, all -3631 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/controllers/analyticsController.js](/backend/controllers/analyticsController.js) | JavaScript | 95 | 13 | 19 | 127 |
| [backend/controllers/clientController.js](/backend/controllers/clientController.js) | JavaScript | 65 | 18 | 20 | 103 |
| [backend/controllers/enchereController.js](/backend/controllers/enchereController.js) | JavaScript | 86 | 20 | 25 | 131 |
| [backend/controllers/imageController.js](/backend/controllers/imageController.js) | JavaScript | 48 | 14 | 15 | 77 |
| [backend/controllers/lotController.js](/backend/controllers/lotController.js) | JavaScript | 115 | 30 | 37 | 182 |
| [backend/controllers/participationController.js](/backend/controllers/participationController.js) | JavaScript | 123 | 22 | 30 | 175 |
| [backend/db.js](/backend/db.js) | JavaScript | 158 | 11 | 19 | 188 |
| [backend/middleware/asyncHandler.js](/backend/middleware/asyncHandler.js) | JavaScript | 4 | 3 | 1 | 8 |
| [backend/middleware/errorHandler.js](/backend/middleware/errorHandler.js) | JavaScript | 8 | 3 | 1 | 12 |
| [backend/middleware/upload.js](/backend/middleware/upload.js) | JavaScript | 26 | 1 | 3 | 30 |
| [backend/package-lock.json](/backend/package-lock.json) | JSON | 1,564 | 0 | 1 | 1,565 |
| [backend/package.json](/backend/package.json) | JSON | 31 | 0 | 1 | 32 |
| [backend/public/asset-manifest.json](/backend/public/asset-manifest.json) | JSON | 19 | 0 | 0 | 19 |
| [backend/public/index.html](/backend/public/index.html) | HTML | 1 | 0 | 0 | 1 |
| [backend/public/manifest.json](/backend/public/manifest.json) | JSON | 20 | 0 | 0 | 20 |
| [backend/public/static/css/main.e8dbc284.css](/backend/public/static/css/main.e8dbc284.css) | PostCSS | 1 | 1 | 0 | 2 |
| [backend/public/static/js/239.f250c1ac.chunk.js](/backend/public/static/js/239.f250c1ac.chunk.js) | JavaScript | 1 | 2 | 0 | 3 |
| [backend/public/static/js/732.e931e226.chunk.js](/backend/public/static/js/732.e931e226.chunk.js) | JavaScript | 1 | 1 | 0 | 2 |
| [backend/public/static/js/977.8bc91af0.chunk.js](/backend/public/static/js/977.8bc91af0.chunk.js) | JavaScript | 1 | 2 | 0 | 3 |
| [backend/public/static/js/main.382ef2ff.js](/backend/public/static/js/main.382ef2ff.js) | JavaScript | 88 | 3 | 12 | 103 |
| [backend/routes/analyticsRoutes.js](/backend/routes/analyticsRoutes.js) | JavaScript | 12 | 3 | 4 | 19 |
| [backend/routes/clientRoutes.js](/backend/routes/clientRoutes.js) | JavaScript | 16 | 5 | 6 | 27 |
| [backend/routes/enchereRoutes.js](/backend/routes/enchereRoutes.js) | JavaScript | 19 | 7 | 10 | 36 |
| [backend/routes/imageRoutes.js](/backend/routes/imageRoutes.js) | JavaScript | 6 | 1 | 2 | 9 |
| [backend/routes/lotRoutes.js](/backend/routes/lotRoutes.js) | JavaScript | 21 | 6 | 7 | 34 |
| [backend/routes/participationRoutes.js](/backend/routes/participationRoutes.js) | JavaScript | 14 | 4 | 5 | 23 |
| [backend/server.js](/backend/server.js) | JavaScript | 45 | 8 | 13 | 66 |
| [backend/template.sql](/backend/template.sql) | MS SQL | 54 | 0 | 6 | 60 |
| [backend/utils/fileUtils.js](/backend/utils/fileUtils.js) | JavaScript | 25 | 9 | 4 | 38 |
| [frontend/src/App.css](/frontend/src/App.css) | PostCSS | -41 | 0 | -7 | -48 |
| [frontend/src/App.js](/frontend/src/App.js) | JavaScript | -53 | 0 | -2 | -55 |
| [frontend/src/components/ModernCard.module.css](/frontend/src/components/ModernCard.module.css) | PostCSS | -63 | 0 | -11 | -74 |
| [frontend/src/components/ModernDialog.module.css](/frontend/src/components/ModernDialog.module.css) | PostCSS | -70 | 0 | -16 | -86 |
| [frontend/src/components/ModernTable.module.css](/frontend/src/components/ModernTable.module.css) | PostCSS | -34 | 0 | -6 | -40 |
| [frontend/src/components/bundles/AddBundleDialog.js](/frontend/src/components/bundles/AddBundleDialog.js) | JavaScript | -152 | 0 | -2 | -154 |
| [frontend/src/components/bundles/AddBundleDialog.module.css](/frontend/src/components/bundles/AddBundleDialog.module.css) | PostCSS | -29 | 0 | -6 | -35 |
| [frontend/src/components/bundles/BundleCard.js](/frontend/src/components/bundles/BundleCard.js) | JavaScript | -84 | 0 | -3 | -87 |
| [frontend/src/components/bundles/SellBundleDialog.js](/frontend/src/components/bundles/SellBundleDialog.js) | JavaScript | -97 | 0 | -2 | -99 |
| [frontend/src/components/common/ErrorAlert.js](/frontend/src/components/common/ErrorAlert.js) | JavaScript | -23 | 0 | -2 | -25 |
| [frontend/src/components/common/Loading.js](/frontend/src/components/common/Loading.js) | JavaScript | -21 | 0 | -2 | -23 |
| [frontend/src/components/layout/Header.js](/frontend/src/components/layout/Header.js) | JavaScript | -46 | 0 | -7 | -53 |
| [frontend/src/components/layout/Header.module.css](/frontend/src/components/layout/Header.module.css) | PostCSS | -75 | 0 | -12 | -87 |
| [frontend/src/components/participants/BillCustomizationDialog.js](/frontend/src/components/participants/BillCustomizationDialog.js) | JavaScript | -171 | -1 | -13 | -185 |
| [frontend/src/components/participants/BulkImportForm.js](/frontend/src/components/participants/BulkImportForm.js) | JavaScript | -23 | 0 | -2 | -25 |
| [frontend/src/components/participants/BulkImportForm.module.css](/frontend/src/components/participants/BulkImportForm.module.css) | PostCSS | -17 | 0 | -2 | -19 |
| [frontend/src/components/participants/ParticipantForm.js](/frontend/src/components/participants/ParticipantForm.js) | JavaScript | -127 | -2 | -7 | -136 |
| [frontend/src/components/participants/ParticipantForm.module.css](/frontend/src/components/participants/ParticipantForm.module.css) | PostCSS | -19 | -2 | -3 | -24 |
| [frontend/src/components/participants/ParticipantTable.js](/frontend/src/components/participants/ParticipantTable.js) | JavaScript | -88 | 0 | -4 | -92 |
| [frontend/src/context/AuctionContext.js](/frontend/src/context/AuctionContext.js) | JavaScript | -275 | -21 | -40 | -336 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | -43 | 0 | -8 | -51 |
| [frontend/src/index.js](/frontend/src/index.js) | JavaScript | -15 | 0 | -1 | -16 |
| [frontend/src/pages/Dashboard.js](/frontend/src/pages/Dashboard.js) | JavaScript | -258 | -3 | -15 | -276 |
| [frontend/src/pages/Dashboard.module.css](/frontend/src/pages/Dashboard.module.css) | PostCSS | -188 | 0 | -36 | -224 |
| [frontend/src/pages/ParticipantManagement.js](/frontend/src/pages/ParticipantManagement.js) | JavaScript | 0 | 0 | -1 | -1 |
| [frontend/src/pages/ParticipantManagement.module.css](/frontend/src/pages/ParticipantManagement.module.css) | PostCSS | 0 | 0 | -1 | -1 |
| [frontend/src/pages/Reports.js](/frontend/src/pages/Reports.js) | JavaScript | -247 | 0 | -17 | -264 |
| [frontend/src/pages/Reports.module.css](/frontend/src/pages/Reports.module.css) | PostCSS | -114 | 0 | -20 | -134 |
| [frontend/src/pages/SalesTracking.js](/frontend/src/pages/SalesTracking.js) | JavaScript | -373 | 0 | -13 | -386 |
| [frontend/src/pages/SalesTracking.module.css](/frontend/src/pages/SalesTracking.module.css) | PostCSS | -69 | 0 | -11 | -80 |
| [frontend/src/pages/auctions/AuctionDetail.js](/frontend/src/pages/auctions/AuctionDetail.js) | JavaScript | -185 | 0 | -12 | -197 |
| [frontend/src/pages/auctions/AuctionManagement.js](/frontend/src/pages/auctions/AuctionManagement.js) | JavaScript | -199 | -3 | -13 | -215 |
| [frontend/src/pages/auctions/AuctionManagement.module.css](/frontend/src/pages/auctions/AuctionManagement.module.css) | PostCSS | -33 | 0 | -5 | -38 |
| [frontend/src/pages/bundles/BundleManagement.js](/frontend/src/pages/bundles/BundleManagement.js) | JavaScript | -261 | -16 | -34 | -311 |
| [frontend/src/pages/bundles/BundleManagement.module.css](/frontend/src/pages/bundles/BundleManagement.module.css) | PostCSS | -69 | 0 | -13 | -82 |
| [frontend/src/pages/clients/ClientDetail.js](/frontend/src/pages/clients/ClientDetail.js) | JavaScript | -466 | -4 | -33 | -503 |
| [frontend/src/pages/clients/ClientDetail.module.css](/frontend/src/pages/clients/ClientDetail.module.css) | PostCSS | -143 | -1 | -27 | -171 |
| [frontend/src/pages/clients/ClientsDirectory.js](/frontend/src/pages/clients/ClientsDirectory.js) | JavaScript | -219 | -3 | -19 | -241 |
| [frontend/src/pages/clients/ClientsDirectory.module.css](/frontend/src/pages/clients/ClientsDirectory.module.css) | PostCSS | -99 | 0 | -19 | -118 |
| [frontend/src/pages/participants/ParticipantDetail.js](/frontend/src/pages/participants/ParticipantDetail.js) | JavaScript | -321 | -7 | -31 | -359 |
| [frontend/src/pages/participants/ParticipantDetail.module.css](/frontend/src/pages/participants/ParticipantDetail.module.css) | PostCSS | -231 | 0 | -39 | -270 |
| [frontend/src/pages/participants/ParticipantManagement.js](/frontend/src/pages/participants/ParticipantManagement.js) | JavaScript | -270 | -14 | -28 | -312 |
| [frontend/src/pages/participants/ParticipantManagement.module.css](/frontend/src/pages/participants/ParticipantManagement.module.css) | PostCSS | -109 | -1 | -20 | -130 |
| [frontend/src/services/api.js](/frontend/src/services/api.js) | JavaScript | -155 | -6 | -32 | -193 |
| [frontend/src/styles/buttons.module.css](/frontend/src/styles/buttons.module.css) | PostCSS | -32 | 0 | -4 | -36 |
| [frontend/src/styles/globals.css](/frontend/src/styles/globals.css) | PostCSS | -52 | -5 | -11 | -68 |
| [frontend/src/styles/theme.js](/frontend/src/styles/theme.js) | JavaScript | -31 | 0 | -2 | -33 |
| [frontend/src/utils/api.js](/frontend/src/utils/api.js) | JavaScript | -10 | 0 | -2 | -12 |
| [frontend/src/utils/bundleUtils.js](/frontend/src/utils/bundleUtils.js) | JavaScript | -8 | -2 | -2 | -12 |
| [frontend/src/utils/formatters.js](/frontend/src/utils/formatters.js) | JavaScript | -30 | 0 | -4 | -34 |
| [frontend/src/utils/imageHandlers.js](/frontend/src/utils/imageHandlers.js) | JavaScript | -18 | -17 | -5 | -40 |
| [frontend/src/utils/participantUtils.js](/frontend/src/utils/participantUtils.js) | JavaScript | -41 | -18 | -6 | -65 |
| [frontend/src/utils/pdfUtils.js](/frontend/src/utils/pdfUtils.js) | JavaScript | -94 | -27 | -16 | -137 |
| [frontend/src/utils/utils.js](/frontend/src/utils/utils.js) | JavaScript | -27 | -1 | -5 | -33 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details