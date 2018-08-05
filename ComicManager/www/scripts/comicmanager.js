let comicISBN = "";
let imgURL = "";
let searchIndex = 0;
let comicOptions = [];

function getComicData(isbn) {

    if (!isbnList.includes(isbn)) {
        comicISBN = isbn.toString();
        searchIndex = 0;
        if (comicOptions.length > 0) {
            comicOptions = [];

            for (let i = 0; i < comicOptions.length; i++) {
                $(`${comicOptions[i].title}ListOption`).remove();
            }
        }
        displayLoadingWidget("Seraching");
        getComicInfo();
    } else {
        navigator.notification.alert("Comic already in database", function () { }, "Error");
        navigator.notification.beep(1);
    }

}

function getComicInfo() {

    $('.ui-page-active').hide();

    displayLoadingWidget("Seraching");

    let url = "https://www.googleapis.com/books/v1/volumes?q=ISBN:" + comicISBN + "&startIndex=" + searchIndex + "&maxResults=40&key=" + apiKey;

    fetch(url)
        .then(res => res.json())
        .then((out) => {

            if (out.hasOwnProperty('items') && out.items.length > 0) {
                for (let i = 0; i < out.items.length; i++) {

                    let comic = {
                        isbn: "",
                        title: "",
                        pub: "",
                        desc: "",
                        img: ""
                    };

                    if (out.items[i].volumeInfo.hasOwnProperty('industryIdentifiers')) {
                        for (let j = 0; j < out.items[i].volumeInfo.industryIdentifiers.length; j++) {
                            if (out.items[i].volumeInfo.industryIdentifiers[j].identifier.type === "ISBN_13") {
                                comic.isbn = out.items[i].volumeInfo.industryIdentifiers[j].identifier;
                            } else {
                                comic.isbn = out.items[i].volumeInfo.industryIdentifiers[0].identifier;
                            }
                        }
                    }

                    if (out.items[i].volumeInfo.hasOwnProperty('title')) {
                        comic.title = out.items[i].volumeInfo.title;
                    }

                    if (out.items[i].volumeInfo.hasOwnProperty('publisher')) {
                        comic.pub = out.items[i].volumeInfo.publisher;
                    }

                    if (out.items[i].volumeInfo.hasOwnProperty('description')) {
                        comic.desc = out.items[i].volumeInfo.description;
                    }

                    if (out.items[i].volumeInfo.hasOwnProperty('imageLinks')) {
                        if (out.items[i].volumeInfo.imageLinks.hasOwnProperty('thumbnail')) {
                            comic.img = out.items[i].volumeInfo.imageLinks.thumbnail;
                        }
                    }

                    comicOptions.push(comic);
                }

                if (out.items.length >= 40) {
                    searchIndex += 40;
                    getComicInfo();
                } else {
                    //change to view that lists all the comic options
                    if (comicOptions.length === 1) {
                        comicISBN = comicOptions[0].isbn;
                        imgURL = comicOptions[0].img;
                        $('#text-title').val(comicOptions[0].title);
                        $('#text-pub').val(comicOptions[0].pub);
                        $('#textareaDesc').val(comicOptions[0].desc);
                        $.mobile.changePage("#comicForm", {
                            transition: "slideup",
                            changeHash: false
                        });
                    } else if (comicOptions.length >= 1) {
                        displayComicSelection();
                    }
                }

            } else {
                $.mobile.changePage("#comicForm", {
                    transition: "slideup",
                    changeHash: false
                });
            }

        }).catch(err => {
            console.log(err);

            $.mobile.changePage("#mainMenu", {
                transition: "slideup",
                changeHash: true
            });

            $.mobile.loading("hide");

            alert("Could not get comic info.");

        });
}

function displayComicSelection() {
    for (let i = 0; i < comicOptions.length; i++) {
        let newListItem = `<li class='ui-li-has-thumb ui-first-child' id="${comicOptions[i].title}ListOption">
                                <a href="#" id="selectComic${i}">
                                    <img src='${comicOptions[i].img}'>
                                    <h2>${comicOptions[i].title}</h2>
                                </a>
                            </li >`;

        $('.comicOptionsDisplay').append(newListItem);

        $(`#selectComic${i}`).click(function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            updateSelectedComicDetails(i);
        });
    }

    $.mobile.changePage("#comicOptions", {
        transition: "slideup",
        changeHash: false
    });
    $('.comicOptionsDisplay').listview('refresh');
    $('#comicOptions').page('destroy').page();

    $.mobile.loading("hide");

}

function updateSelectedComicDetails(selectedComic) {

    if (isbnList.includes(comicOptions[selectedComic].isbn)) {
        navigator.notification.alert("Comic already saved", function () { }, "Error");
        navigator.notification.beep(1);
    }
    else {
        displayLoadingWidget("Getting item details");

        comicISBN = comicOptions[selectedComic].isbn;

        imgURL = comicOptions[selectedComic].img;
        imgURL = imgURL.slice(41);

        $('#text-title').val(comicOptions[selectedComic].title);
        $('#text-pub').val(comicOptions[selectedComic].pub);
        $('#textareaDesc').val(comicOptions[selectedComic].desc);

        $.mobile.changePage("#comicForm", {
            transition: "slideup",
            changeHash: false
        });

        $.mobile.loading("hide");
    }

}

$('#formComicData').submit(function (e) {

    displayLoadingWidget("Saving item");

    let title = $('#text-title').val();
    let pub = $('#text-pub').val();
    let desc = $('#textareaDesc').val();
    let boxNumber = $('#number-boxLocation').val();

    saveRecord(comicISBN, title, boxNumber.toString(), pub, desc, imgURL);

    addComicEntry(comicISBN, boxNumber, title, pub, desc, imgURL, true);

    e.preventDefault();

});

function addComicEntry(isbn, boxNumber, title, pub, desc, img, changeView) {
    let newListItem = `<li class='ui-li-has-thumb ui-first-child' id="${isbn}ListItem">
                        <a href="#${isbn}detail" data-rel="popup" data-position-to="window" data-transition="pop">
                            <img src='https://books.google.com/books/content?id=${img}'>
                            <h2>${title}</h2>
                            <p>Box: ${boxNumber}</p>
                        </a>
                        <a href="#${isbn}ComicDelete" data-rel="popup" data-position-to="window" data-transition="pop" data-icon="delete">Purchase album</a>
                       </li >`;

    $('.comicListDisplay').append(newListItem);

    let infoPopUp = `<div data-role="popup" data-history="false" id="${isbn}detail" data-theme="a" data-overlay-theme="b" class="ui-content">
                        <img src='https://books.google.com/books/content?id=${img}'>
                        <h2>${title}</h2>
                        <p>Box: ${boxNumber}</p>
                        <p>${pub}</p>
                        <p>${isbn}</p>
                        <p>${desc}</p>
                        <a href="#" data-rel="back" class="ui-shadow ui-btn ui-corner-all ui-btn-inline ui-mini">Close</a>
                    </div>`;

    $('#contentComicList').append(infoPopUp);

    let deletePopUp = `<div data-role="popup" data-history="false" id="${isbn}ComicDelete" data-theme="a" data-overlay-theme="b" class="ui-content" style="max-width:340px; padding-bottom:2em;">
                        <h3>Delete Comic?</h3>
                        <p>Are you sure you wish to delete the comic entry?</p>
                        <a href="#" class="ui-shadow ui-btn ui-corner-all ui-btn-b ui-icon-check ui-btn-icon-left ui-btn-inline ui-mini" id="${isbn}DeleteButton">Delete</a>
                        <a href="#" data-rel="back" class="ui-shadow ui-btn ui-corner-all ui-btn-inline ui-mini">Cancel</a>
                       </div >`;

    $('#contentComicList').append(deletePopUp);

    $(`#${isbn}DeleteButton`).click(function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        deleteComicEntry(isbn);
    });

    if (changeView === true) {
        changeToComicListview();
        $.mobile.loading("hide");
    }
}

function changeToComicListview() {
    $.mobile.changePage("#comicList", {
        transition: "slideup",
        changeHash: false
    });
    $('.comicListDisplay').listview('refresh');
    $('#comicList').page('destroy').page();
}

function resetForm() {
    $('#text-title').val('');
    $('#text-pub').val('');
    $('#textareaDesc').val('');
    $('#number-boxLocation').val('');
}

function deleteComicEntry(isbn) {
    removeRecord(isbn);

    $(`#${isbn}ListItem`).remove();
    $(`#${isbn}detail`).remove();
    $(`#${isbn}ComicDelete`).remove();

    $.mobile.changePage("#comicList", {
        transition: "slideup",
        changeHash: false
    });
    $('.comicListDisplay').listview('refresh');
    $('#comicList').page('destroy').page();
}

function displayLoadingWidget(text) {
    $.mobile.loading('show', {
        text: text,
        textVisible: true,
        theme: "a",
        textonly: false,
        html: ""
    });
}

function goToComicEntryForm() {
    resetForm();
    $.mobile.changePage("#comicForm", {
        transition: "slideup",
        changeHash: false
    });
}

jQuery(window).load(function () {

    $('.ui-page-active').show();

});

$(document).bind('pagehide', function (event, data) {
    $('.ui-page-active').show();
});