# Dataset hack

The Liferay Dataset component makes REST API calls to load the data to be displayed.

You can specify additional query parameters for those calls in the Dataset configuration:

https://learn.liferay.com/w/dxp/liferay-development/data-sets/managing-data-sets

However, this is limited to fixed values.

This js client extension makes it possible to use dynamic values between curly braces.

Enable it on pages where you want to use context aware Datasets.

## How does it work?

It overrides the native javascript fetch function. :)

## Supported values

The following values are read from the ThemeDisplay javascript object.

```
userId
userName
languageId
companyId
siteId
scopeKey
portalURL
layoutURL
```

And those ones require that you add a custom fragment provided in this repo as well.

```
accountId
displayedEntryId
```

`accountId` can only be read if a commerce channel is associated to the site (otherwise, the commerce context is not available in the request).

The `displayedEntryId` is super useful when you want to use a dataset on a display page template!
