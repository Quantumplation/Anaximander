(function() {
    $(document).ajaxSuccess(function(event, xhr, ajaxOptions) {
        if (ajaxOptions.url == "/grequest/order") {
            var data = JSON.parse(xhr.responseText);
            if (data.event == "order:full_universe") {
                // this is the data we're looking for
                // NOTE: the remote endpoint NEEDS to set the 'Access-Control-Allow-Origin' to accept http://triton.ironhelmet.com
                jQuery.post("http://quantumplation.me/anaximander", data.report); // TODO: finalize endpoint
                console.log("Data sent to the Anaximander server:", data.report);
            }
        }
    });
})();