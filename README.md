# Dataset hack

The Liferay Dataset component makes REST API calls to load the data to be displayed.

You can specify additional query parameters for those calls in the Dataset configuration:

https://learn.liferay.com/w/dxp/liferay-development/data-sets/managing-data-sets

However, this is limited to fixed values.

This js client extension makes it possible to use dynamic values between curly braces.

## How does it work?

It overrides the native javascript fetch function. :)
