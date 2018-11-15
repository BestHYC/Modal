(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    }
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('jquery'));
    }
    else {
        factory(jQuery);
    }
}(function ($, undefined) {
    "use strict"
    if ($.TdrModal) {
        return;
    }
    $.TdrModal = {
        version: '1.1.1.0',
        Auth: 'Hong',
        Des: '天地人模态框jquery插件,api请登录知识库',
        Defaults: {
        	instance_counter:0,
            singleTag: ["input", "img", "br", "hr", "link"],//单标签
            inlineTag: ["input", "button", "p", "label", "a", "span"],//默认与其他标签平行,不会类似div进行包含,
            eventTag: ["click", "mouseover", "mouseon", "mouseout", "dblclick", "abort", "blur", "change", "dblclick", "focus", "keydown", "keyup", "submit", "unload"]
        }
    };
    $.TdrModal.Core = function (id) {
        this._id = id;
        this._curElement = $("#" + id);//current element
        this._curContent = "content" + id;
        this._type = null;//modal type
        this._head = null,//modal head
				this._body = null,//modal body
				this._footer = null,//modal footer,包含按钮的事件单独写
				this.default_event = "click";
        this.default_operate = false;//to do the event which the element had event to do
        this._data = {
            "class": "modal fade in tdr-top40", "style": null,//模态框的基本设置
            is_dropback: true//设置为是否遮罩及模态遮罩
        };
    };
    $.TdrModal.Core.prototype = {
        Init: function () {
            var a = this.Create_Header(), b = this.Create_Body(), c = this.Create_Footer();
            $("body").append($(this.Create_Content((a ? a : ''), (b ? b : ''), (c ? c : ''))));
        },
        Create_Content: function (str, b, c) {
            var data = this._data, content, cont;
            var frag = document.createDocumentFragment();
            content = document.createElement("div");
            content.id = this._id;
            content.className = data["class"];

            //content = "<div id='" + this._id + "' class='"+data["class"]+"'";
            if (data["style"]) {
                content.style.cssText = data["style"];
            }
            if (data["is_dropback"]) {
                content.setAttribute("data-backdrop", "static");
            }
            content.setAttribute("data-keyboard", "false");
            content.setAttribute("tabindex", "-1");
            cont = document.createElement("div");
            cont.className = "modal-content";
            cont.id = this._curContent;
            cont.innerHTML = str;
            cont.appendChild(b);
            cont.appendChild(c);
            content.appendChild(cont);
            frag.appendChild(content);
            return frag;
        },
        /*通过表头的配置信息去添加模态头
		 */
        Create_Header: function () {
            if (this._head) {
                if (typeof this._head === "string") {
                    return "<div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-hidden='true'></button><h4 class='modal-title'>" + this._head + "</h4></div>";
                } else {
                    return "<div class='modal-header'><h4 class='modal-title'>" + this.Create_Tag(this._head) + "</h4><button type='button' class='close' data-dismiss='modal' aria-hidden='true'></button></div>";
                }
            }
        },
        Create_Body: function () {
            var _body = this._body, frag = document.createDocumentFragment(), _div = document.createElement("div");
            _div.className = "modal-body", frag.appendChild(_div);
            if (_body) {
                if (typeof _body === "string") {
                    if (/.\w*html/ig.exec(_body) != null || _body.indexOf("/") != -1) {
                        $(this).TdrAjax({
                            url: _body, success: function (data) {
                                _body = data
                            }, dataType: "html", async: false
                        }, false);
                    }
                    _div.innerHTML = _body;
                } else {
                    _div.innerHTML = this.Create_Tag(_body);
                }
            }
            return frag;
        },
        Create_Footer: function () {
            var frag = document.createDocumentFragment(), arr = [];
            var i_m = document.createElement("div"); i_m.className = "modal-footer";
            var _btn = {
                "ok": { tag: "button", "class": "btn btn-success ok", value: "确认", "data-dismiss": "modal" },
                "cancel": { tag: "button", "class": "btn btn-default", value: "取消", "data-dismiss": "modal" }
            };
            if (typeof this._footer !== "boolean") {//若为true/false,那么就不显示页脚
                if (this._footer) {//若页脚不为空,则显示自定义的页脚
                    //若为字符串则,直接显示字符串为页脚,但不建议这么做,毫无意义
                    if (typeof this._footer === "string") {
                        i_m.innerHTML = this._footer;
                    } else {
                        //如果是数组,那么直接创建对应的事件,但是这里目前限定不允许创建自包含的页脚,因为自包含页面的关系对于页脚来说也毫无意义
                        if (IsArray(this._footer)) {
                            this.Create_EventTag(this._footer).forEach(function (item, index) {
                                i_m.appendChild(item);
                            });
                        } else {
                            /*
							 * 对脚部按钮进行添加默认事件,先判断现有的
							 */
                            var footer = this._footer;
                            for (var prop in _btn) {
                                if (footer[prop] === false) {
                                    _btn[prop] = null;
                                } else {
                                    footer[prop] = this.Merge(footer[prop], null, _btn[prop]);
                                }
                            }

                            for (var prop in footer) {
                                if (footer[prop]) {
                                    arr.push(footer[prop]);
                                }
                            }
                            this.Create_EventTag(arr).forEach(function (item, index) {
                                i_m.appendChild(item);
                            });
                        }

                    }
                } else {
                    this._footer = [{ tag: "button", "class": "btn btn-success ok", value: "确认", "data-dismiss": "modal" },//,"click":this._confirm
								  { tag: "button", "class": "btn btn-default", value: "取消", "data-dismiss": "modal" }]//,"click":this._cancel
                    this.Create_EventTag(this._footer).forEach(function (item, index) {
                        i_m.appendChild(item);
                    });
                }
            }
            frag.appendChild(i_m);
            return frag;
        },
        Create_Tag: function (arg) {
            var strHtml = '';
            for (var i = arg.length - 1; i >= 0; i--) {
                //debugger;
                var temp = arg[i], strEnd = '', tagName = temp["tag"];
                if (IsArray(temp)) {
                    //如果是数组那么会与当前的元素并排执行,不允许访问对象的callee属性
                    //strHtml = arguments.callee(temp) + strHtml;
                    strHtml = this.Create_Tag(temp) + strHtml;//但是遇到自循环便可能出错
                } else {
                    //非数组则从内到外添加标签元素
                    strEnd += "<" + tagName;
                    Object.getOwnPropertyNames(temp).forEach(function (item, index, array) {
                        if (item != "tag") {//不对标签值进行添加
                            if (tagName == "input") {//若为inupt则添加value值,否则不添加value值
                                strEnd += " " + item + "='" + temp[item] + "' ";
                            } else {
                                if (item != "value") {
                                    strEnd += " " + item + "='" + temp[item] + "' ";
                                }
                            }
                        }
                    });
                    //如果不是单标签<input />则<button>对标签</button>value的值位置不一样
                    /*
					 * 单标签在不为第一个参数时,不允许包含任何其他标签,
					 * 若为第一参数时,input型标签不允许包含其他元素,但是其他的单标签都可以包含标签
					 * 第一参数为数组时,则始终并排执行
					 * 
					 * 若标签是双元素则始终向后包容对应的标签
					 * 
					 * 
					 */
                    if ($.TdrModal.Defaults.singleTag.indexOf(tagName) == -1) {
                        //如果是行内标签且不是第一个参数则不包含其他元素
                        //如果是第一个参数,那么全部作为包含元素执行
                        if (i != 0 && $.TdrModal.Defaults.inlineTag.indexOf(tagName) != -1) {
                            strEnd += ">" + (temp["value"] ? temp["value"] : "") + "</" + tagName + ">" + strHtml;
                        } else {
                            strEnd += ">" + (temp["value"] ? temp["value"] : "") + strHtml + "</" + tagName + ">";
                        }
                    } else {
                        strEnd += "/>" + strHtml;
                    }
                    strHtml = strEnd;
                }

            }
            return strHtml;
        },
        Create_EventTag: function (arg) {
            var _div = [];
            for (var j = 0, i = arg.length; j < i; j++) {
                var temp = arg[j], a = document.createElement(temp["tag"]);
                Object.getOwnPropertyNames(temp).forEach(function (item, index) {
                    if (item != "tag") {
                        if ($.TdrModal.Defaults.eventTag.indexOf(item) == -1) {
                            if (item == "class") a.className = temp[item] ? temp[item] : "btn btn-default";
                            else if (item == "value") {
                                if ($.TdrModal.Defaults.singleTag.indexOf(temp["tag"]) != -1) {
                                    a.setAttribute(item, temp[item] ? temp[item] : "默认");
                                } else {
                                    a.innerHTML = temp[item] ? temp[item] : "默认";
                                }
                            } else {
                                a.setAttribute(item, temp[item]);
                            }
                            var that = this;
                            if (index == 1) {
                                if (temp["class"].indexOf("ok") !== -1) {
                                    $(a).on(that.default_event,
                                        function () {
                                            $("#" + that._id).data("tdrModal").data("default_operator", true)
                                        });

                                } else {
                                    $(a).on(that.default_event,
										function () {
										    $("#" + that._id).data("tdrModal").data("default_operator", false)
										});
                                }
                            }

                        } else {
                            if (temp["class"].indexOf("ok") !== -1) {
                                $(a).on(item, this.Merge_Method(this._id, temp[item], true))
                            } else {
                                $(a).on(item, this.Merge_Method(this._id, temp[item]));
                            }
                        }
                    }
                }, this)
                _div.push(a);
            }
            return _div;
        },
        Merge_Method: function (id, callMethod, okOrnot) {
            var self = this;
            return function () {
                if (okOrnot) {
                    $("#" + id).data("tdrModal").data("default_operator", true);
                }
                else $("#" + id).data("tdrModal").data("default_operator", false);
                var _data = {};
                $("#" + id + " input").each(function (index, element) {
                    var a = $(this).attr("id") ? $(this).attr("id") : $(this).attr("name");
                    var b = this;
                    if (a != null) {
                        _data[a] = $(b);
                    }
                    _data[index] = $(b);
                });
                if (typeof callMethod == "function") callMethod(_data,self);
            }
        },
        /*
		 将p中所有的可枚举属性全部复制至0中,并返回0,如果有同名属性,那么p中会替代o中的值
		 并不处理getter/setter以及复制属性,返回一个对象,默认是对此对象的_data数据进行合并,可以复用
		 * */
        Merge: function (p, method, o) {
            o = o ? o : this._data;
            for (var prop in p) {
                if (!p.hasOwnProperty(prop)) continue;
                if (method && method(prop)) continue;
                o[prop] = p[prop];
            }
            return o;
        }
    };
    /*
     .modal类名
     TdrIframe模态框插件名
     id名:需要包含#
     jquery对象
     document.getElementbyId()对象
     * */
    $.TdrModal.reference = function (ele) {
        var obj = null;
        if (ele && ele.id && (!ele.tagName || !ele.nodeType)) { ele = ele.id; }
        if (!obj || !obj.length) {
            try { obj = $(ele); } catch (ignore) { }
        }
        if(!obj || !obj.length){
        	obj=[];
        	$("div.modal").each(function(index,element){
        		if(element.id.indexOf(ele)!=-1){
        			obj.push($(this));
        		}
        	});
        }
        return obj;
    };
    $.TdrModal.Create = function (ele, options,once) {
    	options.Init();
        if(once){
        	$("#" + options._id).data("tdrModal", ele).modal('show');
        }else{
	        ele.each(function () {
	            $(this).on(options.default_event, function (e, ok) {
	                if (!ok) {
	                    $(this).trigger("load_modal",options);
	                    $("#" + options._id).data("tdrModal", $(this)).modal('show');
	                    $("#" + options._id + " input").val("");
	                }
	                if ($(this).data("default_operator") === true) return true;
	                else return false;
	            });
	        });
        }
        $("#" + options._id).on("hidden.bs.modal", function () {
            $(this).data("tdrModal").trigger(options.default_event, true);
        });
        ele.trigger("loading_modal",options);
    };
    $.fn.TdrConfirm = function (arg, opts, event) {
        //debugger;
        var _modal = new $.TdrModal.Core("TdrConfirm" + $.TdrModal.Defaults.instance_counter++);
        if (event) {
            _modal.default_event = event;
        }
        arg = arg ? arg : {};
        _modal.Merge(typeof opts === "object" ? opts : {});
        var _str = (typeof arg === 'string');
        if (_str) {
            _modal._body = arg;
        } else {
            _modal._head = arg["head"];
            _modal._body = arg["body"];
            _modal._footer = arg["footer"];
        }
        $.TdrModal.Create(this, _modal,event===null?true:false);
    }
    $.fn.TdrPrompt = function (arg, opts, event) {
        var _modal = new $.TdrModal.Core("TdrPrompt" + $.TdrModal.Defaults.instance_counter++);
        if (event) {
            _modal.default_event = event;
        }
        arg = arg ? arg : {};
        _modal.Merge(typeof opts === "object" ? opts : {});
        var _str = (typeof arg === 'string');
        if (_str) {
            _modal._body = arg;
        } else {
            _modal._head = arg["head"];
            if (arg["body"] == null) {
                arg["body"] = [{ tag: "div", "class": "form-group" }, { tag: "input", "class": "form-control", type: "text", placeholder: "One fine body", "data-tabindex": "1" }]
            }
            _modal._body = arg["body"];
            _modal._footer = arg["footer"];
        }
        var confirmHandle = arg["confirm"];
        var cancelHandle = arg["cancel"];

        $.TdrModal.Create(this, _modal,event===null?true:false);
    };
    $.fn.TdrOpen = function (arg, opts, event) {
        var _str = (typeof arg === 'string');
        if (_str && $("#" + arg).length) {
            this.each(function () {
                $(this).attr("data-target", "#" + arg).attr("data-toggle", "modal");
            })
            return this;
        }
        var _modal = new $.TdrModal.Core("TdrOpen" + $.TdrModal.Defaults.instance_counter++);
        if (event) {
            _modal.default_event = event;
        }
        arg = arg ? arg : {};
        _modal.Merge(typeof opts === "object" ? opts : {});
        if (_str) {
            _modal._body = arg;
        } else {
            _modal._head = arg["head"];
            _modal._body = arg["body"];
            _modal._footer = arg["footer"];
        }
        $.TdrModal.Create(this, _modal,event===null?true:false);
        return this;
    };
    $.fn.TdrIframe = function (arg, opts, event) {
        arg = arg ? arg : $(this).attr("data-src");
        var _str = (typeof arg === 'string');
        var _modal = new $.TdrModal.Core("TdrIframe" + $.TdrModal.Defaults.instance_counter++);
        arg = arg ? arg : {};
        _modal._head = arg["head"]?arg["head"]:" ";
        //modal_content有自定义样式的时候，如果最后一个字符是';'，后面样式不用用;开头
        //自定义modal_content的样式
        _modal.Merge(typeof opts === "object" ? opts : {});
        if (_str) {
            if (/.\w*html/ig.exec(arg) != null || arg.indexOf("/") != -1) {
                _modal._body = [{ tag: "iframe", "src": arg, "frameborder":0, "style": "width:100%;min-height:200px;min-width:300px;height:100%"}]
            } else {
                return;
            }
        } else {
            if (arg["body"] == null) return;
            if (arg["body"] === true || (/.\w*html/ig.exec(arg["body"]) != null || arg["body"].indexOf("/") != -1)) {
                _modal._body = [{
                    tag: "iframe",
                    "src": arg["body"],
                    "frameborder":0,
                    "style": "width:100%;min-height:200px;min-width:300px;height:100%"
                }]
            } else {
                return;
            }
            _modal._footer = true;
        }
    	if(event){
    		_modal.default_event = event;
    	}
    	$.TdrModal.Create(this, _modal,event===null?true:false);
    	iframeHeight(_modal._id);
    };
    $.fn.TdrAlert = function (arg) {

    };
    function iframeHeight(id){
    	var iframe =  $("#" + id + " iframe"), curentEle=iframe.closest(".modal");
    	var width=curentEle.width(),height=curentEle.height();
    	iframe.width(width==100?screen.availWidth-200:width-20);
		iframe.height(height==100?screen.availHeight-300:height-100);
    }
    function IsArray(o) {
        return Object.prototype.toString.call(o) == '[object Array]';
    }
    $.fn.TdrAjax = function (arg, arg1) {
        var is_obj = (typeof arg === "object"), event_type;
        if (arg1 === false) {
            event_type = false;
        } else {
            event_type = (typeof arg1 === "string") ? arg1 : (typeof arg1 === "undefined") ? "click" : arg1["event"] ? arg1["event"] : "click";
        }
        if (!is_obj) return;
        this.each(function () {
            if (!arg["url"]) {
                arg["url"] = $(this).attr("href");
            } else if (typeof arg["url"] === "string") {
                if (arg["url"].indexOf("data-") !== -1) {
                    arg["url"] = $(this).attr(arg["url"]);
                }
            } else {
                alert("请输入正确的url地址"); return false;
            }
            if (event_type === false) {
                $.ajax(arg);
            } else {
                $(this).on(event_type, function () {
                    $.ajax(arg);
                })
            }

        })
    };
})
)
