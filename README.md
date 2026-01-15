# Dataset hack

The Liferay Dataset component makes REST API calls to load the data to be displayed.

You can specify additional query parameters for those calls in the Dataset configuration:

https://learn.liferay.com/w/dxp/liferay-development/data-sets/managing-data-sets

However, this is limited to fixed values.

This js client extension makes it possible to use dynamic values between curly braces.

Enable it on pages where you want to use context aware Datasets.

## How does it work?

It overrides the native javascript fetch function. :)

## How to trigger it?

Pass the `liferaydds=true` query parameter in the request to trigger the variable
replacement in the HTTP request.

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

## Dates

In addition to that, you can use `now` and `today` for the current date.

Bonus: there's some support for timezone offset.

Some examples will make it easier to explain:

 - `{now}` is now
 - `{today}` is today (midnight), in your local timezone
 - `{today +gmtoffsethours}` is today, GMT
 - `{now-1d}` is 24 hours ago
 - `{now-1h}` is 1 hour ago
 - `{now-30m}` is 30 minutes ago
 - `{now+1d}` is in 24 hours from now
 - `{now+2h}` is in 2 hours from now
 - `{now+20m}` is in 20 minutes from now
 - `{today+1d}` means tomorrow
 - `{today-1d}` means all my troubles seemed so far away

# Long term solution

Tampering with the native `fetch` function is not ideal of course and we'll have to be careful about any side effect on other fetch calls like this one I have already addressed: https://github.com/fabian-bouche-liferay/fetch-context-contributor-cx/commit/644092a2b04511117268f629016263ca89861c85

In the long term, Liferay shall provide such capabilities out of the box.

Keep an eye on:

https://liferay.atlassian.net/browse/LPD-54499

2026-01-14 Update:

https://liferay.atlassian.net/browse/LPD-54155

# Usage

This Data Set hack can be used together with:

 - A client extension to render Data Set elements in a graph
   https://github.com/fabian-bouche-liferay/dataset-graph

 - A client extension to render Data Set elements on a geographic map
   https://github.com/fabian-bouche-liferay/openstreetmap-client-extension

 - A client extension to render Data Set elements in a calendar
   https://github.com/fabian-bouche-liferay/calendar-cx

