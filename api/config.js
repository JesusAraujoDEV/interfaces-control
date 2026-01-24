function jsString(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const dpUrl = process.env.DP_URL || '';
  const authUrl = process.env.AUTH_URL || '';
  const kitchenUrl = process.env.KITCHEN_URL || '';
  const atcUrl = process.env.ATC_URL || '';

  res.status(200).send(
    `window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};\n` +
      `window.__APP_CONFIG__.DP_URL = \`${jsString(dpUrl)}\`;\n` +
      `window.__APP_CONFIG__.AUTH_URL = \`${jsString(authUrl)}\`;\n` +
      `window.__APP_CONFIG__.KITCHEN_URL = \`${jsString(kitchenUrl)}\`;\n` +
      `window.__APP_CONFIG__.ATC_URL = \`${jsString(atcUrl)}\`;\n`
  );
};
