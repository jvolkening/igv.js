/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Broad Institute
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


// Generic functions applicable to all track types

var igv = (function (igv) {

    /**
     * Set defaults for properties applicable to all tracks.
     * Insure required "config" properties are set.
     * @param track
     * @param config
     */
    igv.configTrack = function (track, config) {

        track.config = config;
        track.url = config.url;

        config.name = config.name || config.label;   // synonym for name, label is deprecated
        if (config.name) {
            track.name = config.name;
        }
        else {
            if (config.localFile) track.name = config.localFile.name;
            else track.name = config.url;

        }

        track.id = config.id || track.name;   // TODO -- remove this property, not used

        track.order = config.order;
        track.color = config.color || igv.browser.constants.defaultColor;

        track.removable = config.removable === undefined ? true : config.removable;      // Defaults to true

        track.height = config.height || ('wig' === config.type ? 50 : 100);

        if(config.autoHeight === undefined)  config.autoHeight = config.autoheight; // Some case confusion in the initial releasae

        track.autoHeight = config.autoHeight === undefined ? (config.height === undefined) : config.autoHeight;
        track.minHeight = config.minHeight || Math.min(50, track.height);
        track.maxHeight = config.maxHeight || Math.max(500, track.height);

        if (config.visibilityWindow) {
            track.visibilityWindow = config.visibilityWindow;
        }

        if(track.type === undefined) track.type = config.type;
    };

    igv.setTrackLabel = function (track, label) {

        var vp = _.first(track.trackView.viewports);

        track.name = label;

        vp.$viewport.find('.igv-track-label').html(track.name);

        if (track.trackView) {
            track.trackView.repaint();
        }
    };

    igv.setTrackColor = function (track, color) {

        track.color = color;

        if (track.trackView) {

            track.trackView.repaint();

        }

    };

    igv.paintAxis = function (ctx, pixelWidth, pixelHeight) {

        var x1,
            x2,
            y1,
            y2,
            a,
            b,
            reference,
            shim,
            font = {
                'font': 'normal 10px Arial',
                'textAlign': 'right',
                'strokeStyle': "black"
            };

        if (undefined === this.dataRange || undefined === this.dataRange.max || undefined === this.dataRange.min) {
            return;
        }

        igv.graphics.fillRect(ctx, 0, 0, pixelWidth, pixelHeight, {'fillStyle': "rgb(255, 255, 255)"});

        reference = 0.95 * pixelWidth;
        x1 = reference - 8;
        x2 = reference;

        //shim = 0.5 * 0.125;
        shim = .01;
        y1 = y2 = shim * pixelHeight;

        a = {x: x2, y: y1};

        // tick
        igv.graphics.strokeLine(ctx, x1, y1, x2, y2, font);
        igv.graphics.fillText(ctx, prettyPrint(this.dataRange.max), x1 + 4, y1 + 12, font);

        //shim = 0.25 * 0.125;
        y1 = y2 = (1.0 - shim) * pixelHeight;

        b = {x: x2, y: y1};

        // tick
        igv.graphics.strokeLine(ctx, x1, y1, x2, y2, font);
        igv.graphics.fillText(ctx, prettyPrint(this.dataRange.min), x1 + 4, y1 - 4, font);

        igv.graphics.strokeLine(ctx, a.x, a.y, b.x, b.y, font);

        function prettyPrint(number) {
            // if number >= 100, show whole number
            // if >= 1 show 1 significant digits
            // if <  1 show 2 significant digits

            if (number === 0) {
                return "0";
            } else if (Math.abs(number) >= 10) {
                return number.toFixed();
            } else if (Math.abs(number) >= 1) {
                return number.toFixed(1);
            } else {
                return number.toFixed(2);
            }
        }

    };

    /**
     * Configure item list for contextual (right-click) track popup menu.
     * @param popover
     * @param viewport
     * @param genomicLocation - (bp)
     * @param xOffset - (pixels) within track extent
     * @param yOffset - (pixels) within track extent
     */
    igv.trackPopupMenuItemList = function (popover, viewport, genomicLocation, xOffset, yOffset) {

        var config,
            menuItems;

        if (viewport.trackView.track.popupMenuItemList) {

            config =
                {
                    popover: popover,
                    viewport:viewport,
                    genomicLocation: genomicLocation,
                    x: xOffset,
                    y: yOffset
                };

            menuItems = viewport.trackView.track.popupMenuItemList(config);
        }

        return menuItems;
    };

    /**
     * Configure item list for track "gear" menu.
     * @param popover
     * @param trackView
     */
    igv.trackMenuItemList = function (popover, trackView) {

        var menuItems = [],
            trackItems;

        menuItems.push(igv.trackMenuItem(popover, trackView, "Set track name", function () {
            return "Track Name"
        }, trackView.track.name, function () {

            var alphanumeric = parseAlphanumeric(igv.dialog.$dialogInput.val());

            if (undefined !== alphanumeric) {
                igv.setTrackLabel(trackView.track, alphanumeric);
                trackView.update();
            }

            function parseAlphanumeric(value) {

                var alphanumeric_re = /(?=.*[a-zA-Z].*)([a-zA-Z0-9 ]+)/,
                    alphanumeric = alphanumeric_re.exec(value);

                return (null !== alphanumeric) ? alphanumeric[0] : "untitled";
            }

        }, undefined));

        menuItems.push(igv.trackMenuItem(popover, trackView, "Set track height", function () {
            return "Track Height"
        }, trackView.trackDiv.clientHeight, function () {

            var number = parseFloat(igv.dialog.$dialogInput.val(), 10);

            if (undefined !== number) {
// If explicitly setting the height adust min or max, if neccessary.
                if (trackView.track.minHeight !== undefined && trackView.track.minHeight > number) {
                    trackView.track.minHeight = number;
                }
                if (trackView.track.maxHeight !== undefined && trackView.track.maxHeight < number) {
                    trackView.track.minHeight = number;
                }
                trackView.setTrackHeight(number);
                trackView.track.autoHeight = false;   // Explicitly setting track height turns off autoHeight

            }

        }, undefined));

        if (trackView.track.menuItemList) {

            trackItems = trackView.track.menuItemList(popover);

            if (_.size(trackItems) > 0) {

                _.each(trackItems, function(obj, i){
                    var $e;

                    if (obj.name) {

                        $e = $('<div class="igv-track-menu-item">');
                        if (0 === i) {
                            $e.addClass('igv-track-menu-border-top');
                        }
                        $e.text( obj.name );

                        menuItems.push( { object: $e, click: obj.click, init: obj.init || undefined } );
                    } else {

                        if (0 === i) {
                            obj.object.addClass('igv-track-menu-border-top');
                        }

                        menuItems.push( { object: obj.object, click: obj.click, init: obj.init || undefined } );
                    }

                });

                // trackItems.forEach(function (trackItem, i) {
                //     var str;
                //     if (trackItem.name) {
                //         str = (0 === i) ? '<div class=\"igv-track-menu-item igv-track-menu-border-top\">' : '<div class=\"igv-track-menu-item\">';
                //         str = str + trackItem.name + '</div>';
                //         menuItems.push({object: $(str), click: trackItem.click, init: trackItem.init});
                //     } else {
                //
                //         if (0 === i) {
                //             trackItem.object.addClass("igv-track-menu-border-top");
                //             menuItems.push(trackItem);
                //         } else {
                //             menuItems.push(trackItem);
                //         }
                //     }
                // });

            }
        }

        if (trackView.track.removable !== false) {

            menuItems.push(
                igv.trackMenuItem(popover, trackView, "Remove track", function () {
                    var label = "Remove " + trackView.track.name;
                    return '<div class="igv-dialog-label-centered">' + label + '</div>';
                }, undefined, function () {
                    popover.hide();
                    trackView.browser.removeTrack(trackView.track);
                }, true)
            );
        }

        return menuItems;
    };

    igv.BROKEN_trackMenuItemList = function (popover, trackView) {

        var mapped,
            menuItems = [],
            trackItems;

        menuItems.push(igv.trackMenuItem(popover, trackView, "Set track name", function () {
            return "Track Name"
        }, trackView.track.name, function () {

            var alphanumeric = parseAlphanumeric(igv.dialog.$dialogInput.val());

            if (undefined !== alphanumeric) {
                igv.setTrackLabel(trackView.track, alphanumeric);
                trackView.update();
            }

            function parseAlphanumeric(value) {

                var alphanumeric_re = /(?=.*[a-zA-Z].*)([a-zA-Z0-9 ]+)/,
                    alphanumeric = alphanumeric_re.exec(value);

                return (null !== alphanumeric) ? alphanumeric[0] : "untitled";
            }

        }, undefined));

        menuItems.push(igv.trackMenuItem(popover, trackView, "Set track height", function () {
            return "Track Height"
        }, trackView.trackDiv.clientHeight, function () {

            var number = parseFloat(igv.dialog.$dialogInput.val(), 10);

            if (undefined !== number) {

// If explicitly setting the height adust min or max, if neccessary.
                if (trackView.track.minHeight !== undefined && trackView.track.minHeight > number) {
                    trackView.track.minHeight = number;
                }

                if (trackView.track.maxHeight !== undefined && trackView.track.maxHeight < number) {
                    trackView.track.minHeight = number;
                }

// Explicitly setting track height turns off autoHeight
                trackView.setTrackHeight(number);
                trackView.track.autoHeight = false;

            }

        }, undefined));

        if (trackView.track.menuItemList) {

            trackItems = trackView.track.menuItemList(popover);
            if (_.size(trackItems) > 0) {

                mapped = _.map(trackItems, function (item, i) {
                    var $e,
                        obj = {};
                    if (item.name) {
                        $e = (0 === i) ? $('<div class="igv-track-menu-item igv-track-menu-border-top">') : $('<div class="igv-track-menu-item">');
                        $e.text(item.name);
                        $e.click(item.click);
                    } else {

                        if (0 === i) {
                            item.object.addClass('igv-track-menu-border-top');
                        }

                        $e = item.object;
                        $e.click(item.click);
                    }

                    obj.object = $e;
                    obj.init = item.init || undefined;

                    return obj;

                }); // _.map(...)

                menuItems.concat(mapped);

            } // if (_.size(trackItems) > 0)

        } // if (trackView.track.menuItemList)

        if (trackView.track.removable !== false) {
            menuItems.push(igv.trackMenuItem(popover, trackView, "Remove track", function () {
                var label = "Remove " + trackView.track.name;
                return '<div class="igv-dialog-label-centered">' + label + '</div>';
            }, undefined, function () {
                popover.hide();
                trackView.browser.removeTrack(trackView.track);
            }, true));
        }

        return menuItems;
    };

    /**
     * Configure item for track "gear" menu.
     * @param popover - passed to allow menu-item handler to close popup
     * @param trackView
     * @param menuItemLabel - menu item string
     * @param dialogLabelHandler - dialog label creation handler
     * @param dialogInputValue
     * @param dialogClickHandler
     * @param doAddTopBorder
     */
    igv.trackMenuItem = function (popover, trackView, menuItemLabel, dialogLabelHandler, dialogInputValue, dialogClickHandler, doAddTopBorder) {

        var $e,
            clickHandler;

        $e = $('<div class="igv-track-menu-item">');

        if (true === doAddTopBorder) {
            $e.addClass('igv-track-menu-border-top');
        }

        $e.text(menuItemLabel);

        clickHandler = function(){
            var $element = $(trackView.trackDiv);
            igv.dialog.configure(dialogLabelHandler, dialogInputValue, dialogClickHandler);
            igv.dialog.show($element);
            popover.hide();
        };

        // $e.click(function(){
        //     var $element = $(trackView.trackDiv);
        //     igv.dialog.configure(dialogLabelHandler, dialogInputValue, dialogClickHandler);
        //     igv.dialog.show($element);
        //     popover.hide();
        // });

        // return { object: $e, init: undefined }

        return { name: undefined, object: $e, click: clickHandler, init: undefined }
    };

    igv.dataRangeMenuItem = function (popover, trackView) {

        var $e,
            clickHandler;

        $e = $('<div class="igv-track-menu-item">');
        $e.text('Set data range');

        clickHandler = function () {
            igv.dataRangeDialog.configureWithTrackView(trackView);
            igv.dataRangeDialog.show();
            popover.hide();
        };


        // $e.click(function () {
        //     igv.dataRangeDialog.configureWithTrackView(trackView);
        //     igv.dataRangeDialog.show();
        //     popover.hide();
        // });

        return { name: undefined, object: $e, click: clickHandler, init: undefined }
    };

    igv.colorPickerMenuItem = function (popover, trackView) {
        var $e,
            clickHandler;

        $e = $('<div class="igv-track-menu-item">');
        $e.text('Set track color');

        clickHandler = function () {
            igv.colorPicker.configure(trackView);
            igv.colorPicker.show();
            popover.hide();
        };

        // $e.click(function () {
        //     igv.colorPicker.configure(trackView);
        //     igv.colorPicker.show();
        //     popover.hide();
        // });

        return { name: undefined, object:$e, click:clickHandler, init: undefined }

    };

    return igv;
})(igv || {});