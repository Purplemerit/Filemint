// List of trusted email domains
const TRUSTED_DOMAINS = [
  // Major email providers
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'aol.com', 'zoho.com', 'yandex.com', 'mail.com',

  // Business/Corporate domains (common)
  'company.com', 'business.com', 'work.com',

  // Educational domains
  'edu', 'ac.in', 'ac.uk', 'edu.in',

  // Country-specific major providers
  'rediffmail.com', 'rediff.com', // India
  'gmx.com', 'gmx.de', 'web.de', // Germany
  'mail.ru', // Russia
  'qq.com', '163.com', '126.com', // China
  'naver.com', 'daum.net', // Korea
];

// Comprehensive list of disposable/temporary email domains
const DISPOSABLE_DOMAINS = [
  // Popular temporary email services
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'mailinator.com', 'mailtothis.com', 'mailnesia.com',
  'trashmail.com', 'trash-mail.com', 'throwaway.email',
  'temp-mail.org', 'tempmail.com', 'tempmail.net',
  'getnada.com', 'fakeinbox.com', 'throwawaymail.com',
  'emailondeck.com', 'sharklasers.com', 'guerrillamailblock.com',
  'spambog.com', 'spamgourmet.com', 'mohmal.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'mytrashmail.com', 'dispostable.com', 'mintemail.com',
  'jetable.org', 'maildrop.cc', 'mailcatch.com',
  'anonbox.net', 'anonymousemail.me', 'deadaddress.com',
  'disposableemailaddresses.com', 'disposeamail.com',
  'dodgeit.com', 'dontreg.com', 'emailfake.com',
  'fakemailgenerator.com', 'fakemail.fr', 'filzmail.com',
  'getairmail.com', 'gishpuppy.com', 'grr.la',
  'harakirimail.com', 'hidemail.de', 'incognitomail.com',
  'jetable.fr.nf', 'koszmail.pl', 'kurzepost.de',
  'luxusmail.org', 'meltmail.com', 'mt2009.com',
  'mytempemail.com', 'no-spam.ws', 'noclickemail.com',
  'notmailinator.com', 'nowmymail.com', 'nurfuerspam.de',
  'objectmail.com', 'obobbo.com', 'onewaymail.com',
  'pookmail.com', 'proxymail.eu', 'put2.net',
  'quickinbox.com', 'rcpt.at', 'recode.me',
  'rtrtr.com', 'safe-mail.net', 'safetymail.info',
  'selfdestructingmail.com', 'shortmail.net', 'sneakemail.com',
  'sofimail.com', 'soodonims.com', 'spam4.me',
  'spamail.de', 'spambox.us', 'spamfree24.org',
  'spamhole.com', 'spamify.com', 'spammotel.com',
  'spamobox.com', 'spamspot.com', 'supergreatmail.com',
  'tempemail.net', 'tempinbox.com', 'tempomail.fr',
  'temporarily.de', 'temporaryemail.net', 'temporaryinbox.com',
  'thankyou2010.com', 'tilien.com', 'tmailinator.com',
  'tradermail.info', 'trashdevil.com', 'trashemail.de',
  'trashymail.com', 'trbvm.com', 'wegwerfadresse.de',
  'wegwerfemail.de', 'wegwerfmail.de', 'wegwerfmail.net',
  'wegwerfmail.org', 'wetrainbayarea.com', 'wh4f.org',
  'whyspam.me', 'willselfdestruct.com', 'winemaven.info',
  'wronghead.com', 'wuzup.net', 'xagloo.com',
  'xemaps.com', 'xents.com', 'yesey.net',
  'yuurok.com', 'zippymail.info', 'zoaxe.com',

  // Recently popular ones
  'anonaddy.com', 'simplelogin.com', '33mail.com',
  'burnermail.io', 'improvmx.com', 'erine.email',
  'inboxkitten.com', 'emailnax.com', 'tmail.ws',
  'moakt.com', 'nada.email', 'etranquil.com',
  'vomoto.com', 'emlhub.com', 'emltmp.com',
  'tmail.com', 'tmails.net', 'mowgli.jungleheart.com',

  // One-time/burner services
  'burnthis.email', 'crazymailing.com', 'discard.email',
  'faketempmail.com', 'fastmail.fm', 'filzmail.com',
  'getonemail.com', 'goemailgo.com', 'mailexpire.com',
  'mailforspam.com', 'mailfreeonline.com', 'mailnull.com',
  'mailsac.com', 'mailtemp.net', 'mailtome.de',
  'mailtrix.net', 'nospam.ze.tc', 'owlpic.com',
  'reallymymail.com', 'spam.la', 'spamex.com',
  'spamfree.eu', 'spamgourmet.org', 'spamhole.com',
  'spamspot.com', 'tempail.com', 'tempm.com',
  'temporary-mail.net', 'tfwno.gf', 'thirrty.net',
  'veryrealemail.com', 'zxcmail.net', 'armyspy.com',

  // Domain variations and additional services
  'emailfake.ml', 'mierdamail.com', 'spamthisplease.com',
  'bumpymail.com', 'dt.com', 'e4ward.com',
  'mailbidon.com', 'mail-temporaire.fr', 'mailzi.ru',
  'mytrashmailer.com', 'no-spam.hu', 'spamarrest.com',
  'stuffmail.de', 'thisisnotmyrealemail.com', 'trillianpro.com',
  'twinmail.de', 'upliftnow.com', 'vfemail.net',
  'webm4il.info', 'yopmail.pp.ua', 'discardmail.com',
];

/**
 * Validates if an email is from a legitimate domain
 * @param email - The email address to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateEmailDomain(email: string): { isValid: boolean; message?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }

  // Extract domain from email
  const domain = email.toLowerCase().split('@')[1];

  if (!domain) {
    return { isValid: false, message: 'Invalid email domain' };
  }

  // Check if domain is in disposable list
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      message: 'Temporary or disposable email addresses are not allowed. Please use a legitimate email provider.'
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /temp/i,
    /trash/i,
    /spam/i,
    /fake/i,
    /dispose/i,
    /throw/i,
    /guerrilla/i,
    /mailinator/i,
    /yopmail/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(domain)) {
      return {
        isValid: false,
        message: 'Temporary or disposable email addresses are not allowed. Please use a legitimate email provider.'
      };
    }
  }

  // Additional validation: check for very short or suspicious TLDs
  const tld = domain.split('.').pop();
  const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf', 'gq']; // Free domains often used for spam

  if (tld && suspiciousTLDs.includes(tld)) {
    return {
      isValid: false,
      message: 'This email domain is not supported. Please use a trusted email provider.'
    };
  }

  // Check if it's a known trusted domain or has a valid structure
  const isTrusted = TRUSTED_DOMAINS.some(trustedDomain => {
    return domain === trustedDomain || domain.endsWith('.' + trustedDomain);
  });

  // For corporate/custom domains, allow if they have proper structure
  const hasProperStructure = domain.split('.').length >= 2 &&
                              domain.length >= 5 &&
                              !domain.includes('..') &&
                              tld && tld.length >= 2;

  if (!isTrusted && !hasProperStructure) {
    return {
      isValid: false,
      message: 'Please use a valid email address from a trusted provider.'
    };
  }

  return { isValid: true };
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password is too long (max 128 characters)' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.)' };
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 'abc12345',
    'password1', 'welcome123', 'admin123', 'letmein123', 'monkey123'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: 'This password is too common. Please choose a stronger password' };
  }

  return { isValid: true };
}

/**
 * Generate a random 6-digit OTP
 * @returns 6-digit OTP string
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if user account is locked due to too many failed attempts
 * @param user - User document
 * @returns boolean indicating if account is locked
 */
export function isAccountLocked(user: any): boolean {
  if (!user.lockUntil) return false;
  return user.lockUntil > new Date();
}

/**
 * Get remaining lock time in minutes
 * @param user - User document
 * @returns minutes remaining or 0 if not locked
 */
export function getLockTimeRemaining(user: any): number {
  if (!user.lockUntil || user.lockUntil <= new Date()) return 0;
  return Math.ceil((user.lockUntil.getTime() - new Date().getTime()) / (1000 * 60));
}
