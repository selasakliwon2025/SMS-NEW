const CONFIG = {
  SPREADSHEET_ID: '17sSneTV1ZgMojj3vw4JUwFPHmu1IbR3PFWGk4HZVdxk',
  USERS_SHEET: 'Users',
  SESSION_EXPIRE_SECONDS: 21600,
  TIMEZONE: 'Asia/Jakarta'
};

function doGet(e) {
  const page = e && e.parameter && e.parameter.page
    ? String(e.parameter.page).toLowerCase().trim() : 'login';
  const fileName = page === 'dashboard' ? 'Dashboard'
    : page === 'kapal' ? 'Page_Kapal' : 'Index';
  const template = HtmlService.createTemplateFromFile(fileName);
  template.appUrl = ScriptApp.getService().getUrl();
  return template.evaluate().setTitle('Ship Maintenance System - PT. Jembatan Nusantara')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDatabase() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getUsersSheet() {
  return getDatabase().getSheetByName(CONFIG.USERS_SHEET);
}

function getCurrentDate() {
  return Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'yyyy-MM-dd HH:mm:ss'
  );
}

function getLogoDanantara() {
  return getDriveImageAsDataUri(
    '1mZyv0gKepQvAm2kijUiUqsq0GYqOBH6j'
  );
}

function getLogoASDP() {
  return getDriveImageAsDataUri(
    '1SUeBLAeMueDF0brun0nkWVe0Uh3GU91s'
  );
}

function getLogoJN() {
  return getDriveImageAsDataUri(
    '1DbDGjWlgYZaDDzlCJ0ybfLpAkpLcyfi_'
  );
}

function getDriveImageAsDataUri(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();

  return 'data:' +
    blob.getContentType() +
    ';base64,' +
    Utilities.base64Encode(blob.getBytes());
}

/**
 * Mengambil gambar kapal untuk background banner dashboard.
 * Isi BANNER_IMAGE_FILE_ID dengan ID file gambar kapal di Google Drive.
 */
function getBannerKapal() {
  const BANNER_IMAGE_FILE_ID =
    '1rp2pn8IickRT3zRk2KxOdU460IeCm158';

  return getDriveImageAsDataUri(BANNER_IMAGE_FILE_ID);
}
