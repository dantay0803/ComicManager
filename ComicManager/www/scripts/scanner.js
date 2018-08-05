function scan() {
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            if (!result.cancelled) {
                getComicData(result.text);
            }
        },
        function (error) {
            navigator.notification.alert("Scanning failed: " + error, function () { }, "Error");
            navigator.notification.beep(1);
        }
    );
}