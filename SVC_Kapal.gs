const SHIPS_SHEET = 'Ships';
const ATTACHMENTS_SHEET = 'Attachments';

function getShipsSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(SHIPS_SHEET);
}

function getAttachmentsSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(ATTACHMENTS_SHEET);
}

function getSheetObjects_(sheet) {
  if (!sheet) return [];

  const values = sheet.getDataRange().getDisplayValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function(header) {
    return String(header).trim();
  });

  return values.slice(1).map(function(row) {
    const object = {};

    headers.forEach(function(header, index) {
      object[header] = row[index] || '';
    });

    return object;
  });
}

function getShips() {
  const ships = getSheetObjects_(getShipsSheet_());

  return ships.map(function(ship) {
    return {
      ship_id: ship.ship_id || '',
      ship_code: ship.ship_code || '',
      ship_name: ship.ship_name || '',
      imo_number: ship.imo_number || '',
      ship_type: ship.ship_type || '',
      flag: ship.flag || '',
      year_built: ship.year_built || '',
      length: ship.length || '',
      width: ship.width || '',
      gross_tonnage: ship.gross_tonnage || '',
      passenger_capacity: ship.passenger_capacity || '',
      vehicle_capacity: ship.vehicle_capacity || '',
      home_port: ship.home_port || '',
      operator: ship.operator || '',
      current_status: ship.current_status || '',
      photo_url: ship.photo_url || '',
      notes: ship.notes || '',
      created_at: ship.created_at || '',
      updated_at: ship.updated_at || '',
      attachments: getShipAttachments_(ship.ship_id)
    };
  });
}

function getShipAttachments_(shipId) {
  if (!shipId) {
    return [];
  }

  const attachments = getSheetObjects_(getAttachmentsSheet_());

  return attachments
    .filter(function(item) {
      return String(item.reference_type).toUpperCase() === 'SHIP' &&
        String(item.reference_id) === String(shipId) &&
        item.file_url;
    })
    .map(function(item) {
      return {
        attachment_id: item.attachment_id || '',
        file_name: item.file_name || '',
        file_url: item.file_url || '',
        file_type: item.file_type || ''
      };
    });
}

function createShip(data) {
  if (!data) {
    return {
      success: false,
      message: 'Data kapal tidak ditemukan.'
    };
  }

  const shipCode = String(data.ship_code || '').trim();
  const shipName = String(data.ship_name || '').trim();
  const imoNumber = String(data.imo_number || '').trim();

  if (!shipCode || !shipName) {
    return {
      success: false,
      message: 'Kode kapal dan nama kapal wajib diisi.'
    };
  }

  const sheet = getShipsSheet_();

  if (!sheet) {
    throw new Error('Sheet Ships tidak ditemukan.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const values = sheet.getDataRange().getValues();

    if (values.length === 0) {
      throw new Error('Sheet Ships belum memiliki header.');
    }

    const headers = values[0].map(function(header) {
      return String(header).trim();
    });

    const rows = values.slice(1);

    const shipCodeColumn = headers.indexOf('ship_code');
    const imoColumn = headers.indexOf('imo_number');

    if (shipCodeColumn === -1) {
      throw new Error('Kolom ship_code tidak ditemukan.');
    }

    const duplicateCode = rows.some(function(row) {
      return String(row[shipCodeColumn] || '').trim().toLowerCase() ===
        shipCode.toLowerCase();
    });

    if (duplicateCode) {
      return {
        success: false,
        message: 'Kode kapal sudah digunakan.'
      };
    }

    if (imoNumber && imoColumn !== -1) {
      const duplicateImo = rows.some(function(row) {
        return String(row[imoColumn] || '').trim() === imoNumber;
      });

      if (duplicateImo) {
        return {
          success: false,
          message: 'Nomor IMO sudah digunakan.'
        };
      }
    }

    const shipId = generateShipId_();
    const now = getCurrentDate();

    const record = {
      ship_id: shipId,
      ship_code: shipCode,
      ship_name: shipName,
      imo_number: imoNumber,
      ship_type: String(data.ship_type || '').trim(),
      flag: String(data.flag || '').trim(),
      year_built: String(data.year_built || '').trim(),
      length: String(data.length || '').trim(),
      width: String(data.width || '').trim(),
      gross_tonnage: String(data.gross_tonnage || '').trim(),
      passenger_capacity:
        String(data.passenger_capacity || '').trim(),
      vehicle_capacity:
        String(data.vehicle_capacity || '').trim(),
      home_port: String(data.home_port || '').trim(),
      operator: String(data.operator || '').trim(),
      current_status:
        String(data.current_status || 'Beroperasi').trim(),
      photo_url: String(data.photo_url || '').trim(),
      notes: String(data.notes || '').trim(),
      created_at: now,
      updated_at: now
    };

    const newRow = headers.map(function(header) {
      return Object.prototype.hasOwnProperty.call(record, header)
        ? record[header]
        : '';
    });

    sheet.appendRow(newRow);

    return {
      success: true,
      message: 'Data kapal berhasil ditambahkan.',
      ship_id: shipId
    };

  } finally {
    lock.releaseLock();
  }
}

function generateShipId_() {
  return 'SHP-' +
    Utilities.formatDate(
      new Date(),
      CONFIG.TIMEZONE,
      'yyyyMMdd-HHmmss'
    ) +
    '-' +
    Math.floor(Math.random() * 1000);
}