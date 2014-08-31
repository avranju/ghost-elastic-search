(function($) {
  "use strict";

  $(function() {
    // listen for Enter key on the search box
    $("#searchText").on("keydown", function(e) {
      if(e.which === 13) {
        e.preventDefault();

        // check if there's anything to search and if yes
        // then head over to the search page!
        var query = $("#searchText").val().trim();
        if(query.length > 0) {
          window.location.href = "/search/?q=" + encodeURIComponent(query);
        }
      }
    });
  });

})(jQuery);
