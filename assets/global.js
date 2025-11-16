if (!window.__fetchOverrideInstalled) {

  window.__fetchOverrideInstalled = true;

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
    const gmtOffsetMinutes = new Date().getTimezoneOffset(); // e.g., -120 for GMT+2
    const gmtOffsetHours = -gmtOffsetMinutes / 60;

    let trimmed = str.trim().toLowerCase();

    const gmtOffsetMatch = trimmed.match(/([+-])\s*gmtoffsethours/);
    let applyGmtOffset = 0;

    if (gmtOffsetMatch) {
      const gmtSign = gmtOffsetMatch[1] === '+' ? 1 : -1;
      applyGmtOffset = gmtSign * gmtOffsetHours;
      trimmed = trimmed.replace(/[+-]\s*gmtoffsethours/i, '').trim();
    }

    if (trimmed === 'now') {
      const date = new Date();
      date.setHours(date.getHours() + applyGmtOffset);
      return date.toISOString();
    }

    if (trimmed === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setHours(today.getHours() + applyGmtOffset);
      return today.toISOString();
    }

    const match = trimmed.match(/(now|today)\s*([+-])\s*(\d+)([dhm])/i);
    if (!match) return null;

    const [, base, sign, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10) * (sign === '-' ? -1 : 1);

    let date = new Date();
    if (base.toLowerCase() === 'today') {
      date.setHours(0, 0, 0, 0);
    }

    switch (unit.toLowerCase()) {
      case 'd':
        date.setDate(date.getDate() + amount);
        break;
      case 'h':
        date.setHours(date.getHours() + amount);
        break;
      case 'm':
        date.setMinutes(date.getMinutes() + amount);
        break;
    }

    date.setHours(date.getHours() + applyGmtOffset);

    return date.toISOString();
  };

  window.fetch = async function (input, init = {}) {
      if (!input) {
        console.error("[fetch override] Called with null or undefined input");
        throw new Error("fetch() called with null or undefined input");
      }
    
      let originalUrl;
      let originalMethod;
      if (typeof input === "string") {
        originalUrl = input;
        originalMethod = "GET";
      } else if (input instanceof URL) {
        originalUrl = input.toString();
        originalMethod = "GET";
      } else if (input instanceof Request) {
        originalUrl = input.url;
        originalMethod = input.method;
      } else {
        console.error("[fetch override] Invalid input type for fetch");
        throw new Error("fetch() input must be a string, URL, or Request");
      }

      if (new URL(originalUrl, window.location.origin).searchParams.get("liferaydds") === "true") {

        const allParams = {
          ...getLiferayContext(),
          ...(init.params || {})
        };
      
        console.log("[fetch override] Params available for substitution:", allParams);
      
        let finalUrl = decodeURIComponent(originalUrl).replace(/{([^}]+)}/g, (_, key) => {
          const trimmedKey = key.trim();
      
          if (trimmedKey.startsWith("now") || trimmedKey.startsWith("today")) {
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
            return `%25${trimmedKey}%25` 
          });
        }
      
        const { params, ...safeInit } = finalInit;

        // remove liferaydds=true parameter from query
        try {
          const urlObj = new URL(finalUrl, window.location.origin);

          urlObj.searchParams.delete("liferaydds");

          if (/^https?:\/\//i.test(finalUrl)) {
            finalUrl = urlObj.toString();
          } else {
            finalUrl = urlObj.pathname + urlObj.search + urlObj.hash;
          }
        } catch (e) {
          console.warn("[fetch override] Failed to strip liferaydds param:", e);
        }

        console.log("[fetch override] Final URL:", finalUrl);
        if (safeInit.body) console.log("[fetch override] Final body:", safeInit.body);

        if(originalMethod === "GET") {
          try {
            const urlObj = new URL(finalUrl, window.location.origin);
            if (urlObj.pathname.startsWith("/o/")) {
              window.Liferay.fire("fetch-context-contributor:request", finalUrl);
              const queueKey = "fetchContextContributorQueue";

              try {
                const urlObj = new URL(finalUrl, window.location.origin);
                const basePath = `${window.location.origin}/o${urlObj.pathname.split("/o")[1].split("/").slice(0, 3).join("/")}/`;
                const stored = JSON.parse(sessionStorage.getItem(queueKey)) || {};

                stored[basePath] = finalUrl;

                sessionStorage.setItem(queueKey, JSON.stringify(stored));
              } catch (e) {
                console.warn("[fetch override] Failed to queue per-API event URL:", e);
              }

            }
          } catch (e) {
            console.warn("[fetch override] Invalid URL, skipping event dispatch:", finalUrl, e);
          }
        }

        return originalFetch.call(this, finalUrl, safeInit);

      } else {

        return originalFetch.call(this, input, init);

      }
    
    };

}