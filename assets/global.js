const originalFetch = window.fetch;

const getLiferayContext = () => {
    const td = window.Liferay?.ThemeDisplay;
    const ctd = window.Liferay?.CustomThemeDisplay;
  
    const queryParams = {};
    const searchParams = new URLSearchParams(window.location.search);
  
    for (const [key, value] of searchParams.entries()) {
      queryParams[`query.${key}`] = value;
    }
  
    return {
      userId: td?.getUserId(),
      userName: td?.getUserName(),
      languageId: td?.getLanguageId(),
      companyId: td?.getCompanyId(),
      siteId: td?.getSiteGroupId(),
      scopeKey: td?.getScopeGroupId(),
      portalURL: td?.getPortalURL(),
      layoutURL: td?.getLayoutURL(),
      accountId: ctd?.getAccountId?.(),
      displayedEntryId: ctd?.getDisplayEntryId?.(),
      ...queryParams
    };
};

const parseDateMath = (str) => {
  const match = str.match(/now\s*([+-])\s*(\d+)([dhm])/i);
  if (!match) return null;

  const [, sign, amountStr, unit] = match;
  const amount = parseInt(amountStr) * (sign === '-' ? -1 : 1);
  const now = new Date();

  switch (unit) {
    case 'd':
      now.setDate(now.getDate() + amount);
      break;
    case 'h':
      now.setHours(now.getHours() + amount);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + amount);
      break;
  }

  return now.toISOString();
};

window.fetch = async function (input, init = {}) {
    if (!input) {
      console.error("[fetch override] Called with null or undefined input");
      throw new Error("fetch() called with null or undefined input");
    }
  
    let originalUrl;
    if (typeof input === "string") {
      originalUrl = input;
    } else if (input instanceof URL) {
      originalUrl = input.toString();
    } else if (input instanceof Request) {
      originalUrl = input.url;
    } else {
      console.error("[fetch override] Invalid input type for fetch");
      throw new Error("fetch() input must be a string, URL, or Request");
    }
  
    const allParams = {
      ...getLiferayContext(),
      ...(init.params || {})
    };
  
    console.log("[fetch override] Params available for substitution:", allParams);
  
    let finalUrl = decodeURIComponent(originalUrl).replace(/{([^}]+)}/g, (_, key) => {
      const trimmedKey = key.trim();
  
      if (trimmedKey.startsWith("now")) {
        const parsed = parseDateMath(trimmedKey);
        if (parsed) {
          console.log(`[fetch override] Substituted {${trimmedKey}} with`, parsed);
          return encodeURIComponent(parsed);
        }
      }
  
      if (allParams.hasOwnProperty(trimmedKey)) {
        console.log(`[fetch override] Substituted {${trimmedKey}} with`, allParams[trimmedKey]);
        return encodeURIComponent(allParams[trimmedKey]);
      }
  
      console.warn(`[fetch override] Missing parameter for {${trimmedKey}}`);
      //throw new Error(`Missing parameter: ${trimmedKey}`);
      return `%7B${trimmedKey}%7D` 
    });
  
    let finalInit = { ...init };
    if (typeof init.body === "string") {
      finalInit.body = init.body.replace(/%([^%]+)%/g, (_, key) => {
        const trimmedKey = key.trim();
  
        if (trimmedKey.startsWith("now")) {
          const parsed = parseDateMath(trimmedKey);
          if (parsed) {
            console.log(`[fetch override] Substituted %${trimmedKey}% with`, parsed);
            return parsed;
          }
        }
  
        if (allParams.hasOwnProperty(trimmedKey)) {
          console.log(`[fetch override] Substituted %${trimmedKey}% with`, allParams[trimmedKey]);
          return allParams[trimmedKey];
        }
  
        console.warn(`[fetch override] Missing parameter for %${trimmedKey}%`);
        //throw new Error(`Missing parameter: ${trimmedKey}`);
        return `%25${trimmedKey}%25` 
      });
    }
  
    const { params, ...safeInit } = finalInit;
  
    console.log("[fetch override] Final URL:", finalUrl);
    if (safeInit.body) console.log("[fetch override] Final body:", safeInit.body);
  
    return originalFetch.call(this, finalUrl, safeInit);
  };