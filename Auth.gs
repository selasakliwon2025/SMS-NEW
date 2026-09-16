function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password),
    Utilities.Charset.UTF_8
  );

  return rawHash
    .map(function(byte) {
      const value = byte < 0 ? byte + 256 : byte;
      return ('0' + value.toString(16)).slice(-2);
    })
    .join('');
}

function generateUserId() {
  return 'USR-' + new Date().getTime();
}

function getUserRecords() {
  const sheet = getUsersSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0];

  return values.slice(1).map(function(row) {
    const user = {};

    headers.forEach(function(header, index) {
      user[header] = row[index];
    });

    return user;
  });
}

function findUserByNip(nip) {
  return getUserRecords().find(function(user) {
    return String(user.nip).trim() === String(nip).trim();
  });
}

function createSession(user) {
  const token = Utilities.getUuid();

  const sessionData = {
    user_id: user.user_id,
    nip: user.nip,
    full_name: user.full_name,
    role: user.role,
    position: user.position,
    login_at: getCurrentDate()
  };

  CacheService
    .getScriptCache()
    .put(
      'SESSION_' + token,
      JSON.stringify(sessionData),
      CONFIG.SESSION_EXPIRE_SECONDS
    );

  return {
    token: token,
    user: sessionData
  };
}

function getSession(token) {
  if (!token) {
    return null;
  }

  const cacheValue = CacheService
    .getScriptCache()
    .get('SESSION_' + token);

  return cacheValue ? JSON.parse(cacheValue) : null;
}

function logout(token) {
  if (token) {
    CacheService
      .getScriptCache()
      .remove('SESSION_' + token);
  }

  return {
    success: true
  };
}

function login(nip, password) {
  nip = String(nip || '').trim();
  password = String(password || '');

  if (!nip || !password) {
    return {
      success: false,
      message: 'NIP dan password wajib diisi.'
    };
  }

  const user = findUserByNip(nip);

  if (!user) {
    return {
      success: false,
      message: 'NIP atau password tidak sesuai.'
    };
  }

  if (String(user.status).toUpperCase() !== 'ACTIVE') {
    return {
      success: false,
      message: 'Akun Anda tidak aktif. Silakan hubungi administrator.'
    };
  }

  const inputHash = hashPassword(password);
  const savedHash = String(user.password_hash || '').trim();

  if (!savedHash || inputHash !== savedHash) {
    return {
      success: false,
      message: 'NIP atau password tidak sesuai.'
    };
  }

  updateLastLogin(user.user_id);

  const session = createSession(user);

  return {
    success: true,
    message: 'Login berhasil.',
    token: session.token,
    user: session.user
  };
}

function updateLastLogin(userId) {
  const sheet = getUsersSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return;
  }

  const headers = values[0];
  const userIdColumn = headers.indexOf('user_id');
  const lastLoginColumn = headers.indexOf('last_login');

  if (userIdColumn === -1 || lastLoginColumn === -1) {
    return;
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][userIdColumn]) === String(userId)) {
      sheet
        .getRange(i + 1, lastLoginColumn + 1)
        .setValue(getCurrentDate());

      break;
    }
  }
}