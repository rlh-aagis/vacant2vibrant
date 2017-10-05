
function isDefined (obj) {
	return ((typeof obj !== 'undefined') && (obj !== null));
}

function centerModal () {
    $(this).css('display', 'block');
    var $dialog = $(this).find(".modal-dialog"),
	offset = ($(window).height() - $dialog.height()) / 2,
	bottomMargin = parseInt($dialog.css('marginBottom'), 10);

    if (offset < bottomMargin) offset = bottomMargin;
    $dialog.css("margin-top", offset);
}

function formatNumber (num) {
	if (num == null) return '';
    var parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
