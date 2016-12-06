insert into "service_workers" ("contents", "install_state", "last_checked", "scope", "url") values ('/** Virtual DOM Node */
function VNode(nodeName, attributes, children) {
	/** @type {string|function} */
	this.nodeName = nodeName;

	/** @type {object<string>|undefined} */
	this.attributes = attributes;

	/** @type {array<VNode>|undefined} */
	this.children = children;

	/** Reference to the given key. */
	this.key = attributes && attributes.key;
}

/** Copy own-properties from `props` onto `obj`.
 *	@returns obj
 *	@private
 */
function extend(obj, props) {
	if (props) {
		for (var i in props) {
			if (props[i]!==undefined) {
				obj[i] = props[i];
			}
		}
	}
	return obj;
}


/** Fast clone. Note: does not filter out non-own properties.
 *	@see https://esbench.com/bench/56baa34f45df6895002e03b6
 */
function clone(obj) {
	return extend({}, obj);
}


/** Get a deep property value from the given object, expressed in dot-notation.
 *	@private
 */
function delve(obj, key) {
	for (var p=key.split(''.''), i=0; i<p.length && obj; i++) {
		obj = obj[p[i]];
	}
	return obj;
}


/** @private is the given object a Function? */
function isFunction(obj) {
	return ''function''===typeof obj;
}


/** @private is the given object a String? */
function isString(obj) {
	return ''string''===typeof obj;
}


/** Check if a value is `null` or `undefined`.
 *	@private
 */
function empty(x) {
	return x===undefined || x===null;
}


/** Check if a value is `null`, `undefined`, or explicitly `false`. */
function falsey(value) {
	return value===false || empty(value);
}


/** Convert a hashmap of CSS classes to a space-delimited className string
 *	@private
 */
function hashToClassName(c) {
	var str = '''';
	for (var prop in c) {
		if (c[prop]) {
			if (str) str += '' '';
			str += prop;
		}
	}
	return str;
}


/** Just a memoized String#toLowerCase */
var lcCache = {};
var toLowerCase = function (s) { return lcCache[s] || (lcCache[s] = s.toLowerCase()); };


/** Call a function asynchronously, as soon as possible.
 *	@param {Function} callback
 */
var resolved = typeof Promise!==''undefined'' && Promise.resolve();
var defer = resolved ? (function (f) { resolved.then(f); }) : setTimeout;

/** Global options
 *	@public
 *	@namespace options {Object}
 */
var options = {

	/** If `true`, `prop` changes trigger synchronous component updates.
	 *	@name syncComponentUpdates
	 *	@type Boolean
	 *	@default true
	 */
	//syncComponentUpdates: true,

	/** Processes all created VNodes.
	 *	@param {VNode} vnode	A newly-created VNode to normalize/process
	 */
	vnode: empty
};

var SHARED_TEMP_ARRAY = [];


/** JSX/hyperscript reviver
 *	@see http://jasonformat.com/wtf-is-jsx
 *	@public
 *  @example
 *  /** @jsx h *\/
 *  import { render, h } from ''preact'';
 *  render(<span>foo</span>, document.body);
 */
function h(nodeName, attributes, firstChild) {
	var arguments$1 = arguments;

	var len = arguments.length,
		children, arr, lastSimple;


	if (len>2) {
		var type = typeof firstChild;
		if (len===3 && type!==''object'' && type!==''function'') {
			if (!falsey(firstChild)) {
				children = [String(firstChild)];
			}
		}
		else {
			children = [];
			for (var i=2; i<len; i++) {
				var p$1 = arguments$1[i];
				if (falsey(p$1)) continue;
				if (p$1.join) arr = p$1;
				else (arr = SHARED_TEMP_ARRAY)[0] = p$1;
				for (var j=0; j<arr.length; j++) {
					var child = arr[j],
						simple = !(falsey(child) || isFunction(child) || child instanceof VNode);
					if (simple && !isString(child)) child = String(child);
					if (simple && lastSimple) {
						children[children.length-1] += child;
					}
					else if (!falsey(child)) {
						children.push(child);
						lastSimple = simple;
					}
				}
			}
		}
	}
	else if (attributes && attributes.children) {
		return h(nodeName, attributes, attributes.children);
	}

	if (attributes) {
		if (attributes.children) {
			delete attributes.children;
		}

		if (!isFunction(nodeName)) {
			// normalize className to class.
			if (''className'' in attributes) {
				attributes.class = attributes.className;
				delete attributes.className;
			}

			lastSimple = attributes.class;
			if (lastSimple && !isString(lastSimple)) {
				attributes.class = hashToClassName(lastSimple);
			}

			// lastSimple = attributes.style;
			// if (lastSimple && !isString(lastSimple)) {
			// 	attributes.style = styleObjToCss(lastSimple);
			// }
		}
	}

	var p = new VNode(nodeName, attributes || undefined, children);
	if (options.vnode) options.vnode(p);
	return p;
}

// render modes

var NO_RENDER = 0;
var SYNC_RENDER = 1;
var FORCE_RENDER = 2;
var ASYNC_RENDER = 3;

var EMPTY = {};

var ATTR_KEY = typeof Symbol!==''undefined'' ? Symbol.for(''preactattr'') : ''__preactattr_'';

// DOM properties that should NOT have "px" added when numeric
var NON_DIMENSION_PROPS = {
	boxFlex:1, boxFlexGroup:1, columnCount:1, fillOpacity:1, flex:1, flexGrow:1,
	flexPositive:1, flexShrink:1, flexNegative:1, fontWeight:1, lineClamp:1, lineHeight:1,
	opacity:1, order:1, orphans:1, strokeOpacity:1, widows:1, zIndex:1, zoom:1
};

/** Create an Event handler function that sets a given state property.
 *	@param {Component} component	The component whose state should be updated
 *	@param {string} key				A dot-notated key path to update in the component''s state
 *	@param {string} eventPath		A dot-notated key path to the value that should be retrieved from the Event or component
 *	@returns {function} linkedStateHandler
 *	@private
 */
function createLinkedState(component, key, eventPath) {
	var path = key.split(''.''),
		p0 = path[0];
	return function(e) {
		var t = e && e.currentTarget || this,
			s = component.state,
			obj = s,
			v, i;
		if (isString(eventPath)) {
			v = delve(e, eventPath);
			if (empty(v) && (t=t._component)) {
				v = delve(t, eventPath);
			}
		}
		else {
			v = t.nodeName ? ((t.nodeName+t.type).match(/^input(check|rad)/i) ? t.checked : t.value) : e;
		}
		if (isFunction(v)) v = v.call(t);
		if (path.length>1) {
			for (i=0; i<path.length-1; i++) {
				obj = obj[path[i]] || (obj[path[i]] = {});
			}
			obj[path[i]] = v;
			v = s[p0];
		}
		var obj$1;
		component.setState(( obj$1 = {}, obj$1[p0] = v, obj$1 ));
	};
}

var items = [];
var itemsOffline = [];
function enqueueRender(component) {
	if (items.push(component)!==1) return;

	(options.debounceRendering || defer)(rerender);
}


function rerender() {
	if (!items.length) return;

	var currentItems = items,
		p;

	// swap online & offline
	items = itemsOffline;
	itemsOffline = currentItems;

	while ( (p = currentItems.pop()) ) {
		if (p._dirty) renderComponent(p);
	}
}

/** Check if a VNode is a reference to a stateless functional component.
 *	A function component is represented as a VNode whose `nodeName` property is a reference to a function.
 *	If that function is not a Component (ie, has no `.render()` method on a prototype), it is considered a stateless functional component.
 *	@param {VNode} vnode	A VNode
 *	@private
 */
function isFunctionalComponent(vnode) {
	var nodeName = vnode && vnode.nodeName;
	return nodeName && isFunction(nodeName) && !(nodeName.prototype && nodeName.prototype.render);
}



/** Construct a resultant VNode from a VNode referencing a stateless functional component.
 *	@param {VNode} vnode	A VNode with a `nodeName` property that is a reference to a function.
 *	@private
 */
function buildFunctionalComponent(vnode, context) {
	return vnode.nodeName(getNodeProps(vnode), context || EMPTY);
}

function ensureNodeData(node, data) {
	return node[ATTR_KEY] || (node[ATTR_KEY] = (data || {}));
}


function getNodeType(node) {
	if (node instanceof Text) return 3;
	if (node instanceof Element) return 1;
	return 0;
}


/** Removes a given DOM Node from its parent. */
function removeNode(node) {
	var p = node.parentNode;
	if (p) p.removeChild(node);
}


/** Set a named attribute on the given Node, with special behavior for some names and event handlers.
 *	If `value` is `null`, the attribute/handler will be removed.
 *	@param {Element} node	An element to mutate
 *	@param {string} name	The name/key to set, such as an event or attribute name
 *	@param {any} value		An attribute value, such as a function to be used as an event handler
 *	@param {any} previousValue	The last value that was set for this name/node pair
 *	@private
 */
function setAccessor(node, name, value, old, isSvg) {
	ensureNodeData(node)[name] = value;

	if (name===''key'' || name===''children'' || name===''innerHTML'') return;

	if (name===''class'' && !isSvg) {
		node.className = value || '''';
	}
	else if (name===''style'') {
		if (!value || isString(value) || isString(old)) {
			node.style.cssText = value || '''';
		}
		if (value && typeof value===''object'') {
			if (!isString(old)) {
				for (var i in old) if (!(i in value)) node.style[i] = '''';
			}
			for (var i$1 in value) {
				node.style[i$1] = typeof value[i$1]===''number'' && !NON_DIMENSION_PROPS[i$1] ? (value[i$1]+''px'') : value[i$1];
			}
		}
	}
	else if (name===''dangerouslySetInnerHTML'') {
		if (value) node.innerHTML = value.__html;
	}
	else if (name.match(/^on/i)) {
		var l = node._listeners || (node._listeners = {});
		name = toLowerCase(name.substring(2));
		if (value) {
			if (!l[name]) node.addEventListener(name, eventProxy);
		}
		else if (l[name]) {
			node.removeEventListener(name, eventProxy);
		}
		l[name] = value;
	}
	else if (name!==''type'' && !isSvg && name in node) {
		setProperty(node, name, empty(value) ? '''' : value);
		if (falsey(value)) node.removeAttribute(name);
	}
	else {
		var ns = isSvg && name.match(/^xlink\:?(.+)/);
		if (falsey(value)) {
			if (ns) node.removeAttributeNS(''http://www.w3.org/1999/xlink'', toLowerCase(ns[1]));
			else node.removeAttribute(name);
		}
		else if (typeof value!==''object'' && !isFunction(value)) {
			if (ns) node.setAttributeNS(''http://www.w3.org/1999/xlink'', toLowerCase(ns[1]), value);
			else node.setAttribute(name, value);
		}
	}
}


/** Attempt to set a DOM property to the given value.
 *	IE & FF throw for certain property-value combinations.
 */
function setProperty(node, name, value) {
	try {
		node[name] = value;
	} catch (e) { }
}


/** Proxy an event to hooked event handlers
 *	@private
 */
function eventProxy(e) {
	return this._listeners[e.type](options.event && options.event(e) || e);
}


/** Get a node''s attributes as a hashmap.
 *	@private
 */
function getRawNodeAttributes(node) {
	var attrs = {};
	for (var i=node.attributes.length; i--; ) {
		attrs[node.attributes[i].name] = node.attributes[i].value;
	}
	return attrs;
}

/** Check if two nodes are equivalent.
 *	@param {Element} node
 *	@param {VNode} vnode
 *	@private
 */
function isSameNodeType(node, vnode) {
	if (isString(vnode)) {
		return getNodeType(node)===3;
	}
	if (isString(vnode.nodeName)) {
		return isNamedNode(node, vnode.nodeName);
	}
	if (isFunction(vnode.nodeName)) {
		return node._componentConstructor===vnode.nodeName || isFunctionalComponent(vnode);
	}
}


function isNamedNode(node, nodeName) {
	return node.normalizedNodeName===nodeName || toLowerCase(node.nodeName)===toLowerCase(nodeName);
}


/**
 * Reconstruct Component-style `props` from a VNode.
 * Ensures default/fallback values from `defaultProps`:
 * Own-properties of `defaultProps` not present in `vnode.attributes` are added.
 * @param {VNode} vnode
 * @returns {Object} props
 */
function getNodeProps(vnode) {
	var defaultProps = vnode.nodeName.defaultProps,
		props = clone(defaultProps || vnode.attributes);

	if (defaultProps) extend(props, vnode.attributes);

	if (vnode.children) props.children = vnode.children;

	return props;
}

/** DOM node pool, keyed on nodeName. */

var nodes = {};

function collectNode(node) {
	cleanNode(node);
	var name = toLowerCase(node.nodeName),
		list = nodes[name];
	if (list) list.push(node);
	else nodes[name] = [node];
}


function createNode(nodeName, isSvg) {
	var name = toLowerCase(nodeName),
		node = nodes[name] && nodes[name].pop() || (isSvg ? document.createElementNS(''http://www.w3.org/2000/svg'', nodeName) : document.createElement(nodeName));
	ensureNodeData(node);
	node.normalizedNodeName = name;
	return node;
}


function cleanNode(node) {
	removeNode(node);

	if (getNodeType(node)!==1) return;

	// When reclaiming externally created nodes, seed the attribute cache: (Issue #97)

	ensureNodeData(node, getRawNodeAttributes(node));

	node._component = node._componentConstructor = null;

	// if (node.childNodes.length>0) {
	// 	console.trace(`Warning: Recycler collecting <${node.nodeName}> with ${node.childNodes.length} children.`);
	// 	for (let i=node.childNodes.length; i--; ) collectNode(node.childNodes[i]);
	// }
}

/** Diff recursion count, used to track the end of the diff cycle. */
var mounts = [];

/** Diff recursion count, used to track the end of the diff cycle. */
var diffLevel = 0;

var isSvgMode = false;


function flushMounts() {
	var c;
	while ((c=mounts.pop())) {
		if (c.componentDidMount) c.componentDidMount();
	}
}


/** Apply differences in a given vnode (and it''s deep children) to a real DOM Node.
 *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
 *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
 *	@returns {Element} dom			The created/mutated element
 *	@private
 */
function diff(dom, vnode, context, mountAll, parent, rootComponent, nextSibling) {
	diffLevel++;
	var ret = idiff(dom, vnode, context, mountAll, rootComponent);
	if (parent && ret.parentNode!==parent) {
		parent.insertBefore(ret, nextSibling || null);
	}
	if (!--diffLevel) flushMounts();
	return ret;
}


function idiff(dom, vnode, context, mountAll, rootComponent) {
	var originalAttributes = vnode && vnode.attributes;

	while (isFunctionalComponent(vnode)) {
		vnode = buildFunctionalComponent(vnode, context);
	}

	if (empty(vnode)) {
		vnode = '''';
		if (rootComponent) {
			if (dom) {
				if (dom.nodeType===8) return dom;
				collectNode(dom);
			}
			return document.createComment(vnode);
		}
	}

	if (isString(vnode)) {
		if (dom) {
			if (getNodeType(dom)===3 && dom.parentNode) {
				dom.nodeValue = vnode;
				return dom;
			}
			collectNode(dom);
		}
		return document.createTextNode(vnode);
	}

	var out = dom,
		nodeName = vnode.nodeName,
		svgMode;

	if (isFunction(nodeName)) {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}

	if (!isString(nodeName)) {
		nodeName = String(nodeName);
	}

	svgMode = toLowerCase(nodeName)===''svg'';

	if (svgMode) isSvgMode = true;

	if (!dom) {
		out = createNode(nodeName, isSvgMode);
	}
	else if (!isNamedNode(dom, nodeName)) {
		out = createNode(nodeName, isSvgMode);
		// move children into the replacement node
		while (dom.firstChild) out.appendChild(dom.firstChild);
		// reclaim element nodes
		recollectNodeTree(dom);
	}

	// fast-path for elements containing a single TextNode:
	if (vnode.children && vnode.children.length===1 && typeof vnode.children[0]===''string'' && out.childNodes.length===1 && out.firstChild instanceof Text) {
		out.firstChild.nodeValue = vnode.children[0];
	}
	else if (vnode.children || out.firstChild) {
		innerDiffNode(out, vnode.children, context, mountAll);
	}

	diffAttributes(out, vnode.attributes);

	if (originalAttributes && originalAttributes.ref) {
		(out[ATTR_KEY].ref = originalAttributes.ref)(out);
	}

	if (svgMode) isSvgMode = false;

	return out;
}


/** Apply child and attribute changes between a VNode and a DOM Node to the DOM. */
function innerDiffNode(dom, vchildren, context, mountAll) {
	var originalChildren = dom.childNodes,
		children = [],
		keyed = {},
		keyedLen = 0,
		min = 0,
		len = originalChildren.length,
		childrenLen = 0,
		vlen = vchildren && vchildren.length,
		j, c, vchild, child;

	if (len) {
		for (var i=0; i<len; i++) {
			var child$1 = originalChildren[i],
				key = vlen ? ((c = child$1._component) ? c.__key : (c = child$1[ATTR_KEY]) ? c.key : null) : null;
			if (key || key===0) {
				keyedLen++;
				keyed[key] = child$1;
			}
			else {
				children[childrenLen++] = child$1;
			}
		}
	}

	if (vlen) {
		for (var i$1=0; i$1<vlen; i$1++) {
			vchild = vchildren[i$1];
			child = null;

			// if (isFunctionalComponent(vchild)) {
			// 	vchild = buildFunctionalComponent(vchild);
			// }

			// attempt to find a node based on key matching
			if (keyedLen && vchild.attributes) {
				var key$1 = vchild.key;
				if (!empty(key$1) && key$1 in keyed) {
					child = keyed[key$1];
					keyed[key$1] = undefined;
					keyedLen--;
				}
			}

			// attempt to pluck a node of the same type from the existing children
			if (!child && min<childrenLen) {
				for (j=min; j<childrenLen; j++) {
					c = children[j];
					if (c && isSameNodeType(c, vchild)) {
						child = c;
						children[j] = undefined;
						if (j===childrenLen-1) childrenLen--;
						if (j===min) min++;
						break;
					}
				}
			}

			// morph the matched/found/created DOM child to match vchild (deep)
			child = idiff(child, vchild, context, mountAll);

			if (child!==originalChildren[i$1]) {
				dom.insertBefore(child, originalChildren[i$1] || null);
			}
		}
	}


	if (keyedLen) {
		/*eslint guard-for-in:0*/
		for (var i$2 in keyed) if (keyed[i$2]) {
			children[min=childrenLen++] = keyed[i$2];
		}
	}

	// remove orphaned children
	if (min<childrenLen) {
		removeOrphanedChildren(children);
	}
}


/** Reclaim children that were unreferenced in the desired VTree */
function removeOrphanedChildren(children, unmountOnly) {
	for (var i=children.length; i--; ) {
		var child = children[i];
		if (child) {
			recollectNodeTree(child, unmountOnly);
		}
	}
}


/** Reclaim an entire tree of nodes, starting at the root. */
function recollectNodeTree(node, unmountOnly) {
	// @TODO: Need to make a call on whether Preact should remove nodes not created by itself.
	// Currently it *does* remove them. Discussion: https://github.com/developit/preact/issues/39
	//if (!node[ATTR_KEY]) return;

	var component = node._component;
	if (component) {
		unmountComponent(component, !unmountOnly);
	}
	else {
		if (node[ATTR_KEY] && node[ATTR_KEY].ref) node[ATTR_KEY].ref(null);

		if (!unmountOnly) {

			collectNode(node);
		}

		if (node.childNodes && node.childNodes.length) {
			removeOrphanedChildren(node.childNodes, unmountOnly);
		}
	}
}


/** Apply differences in attributes from a VNode to the given DOM Node. */
function diffAttributes(dom, attrs) {
	var old = dom[ATTR_KEY] || getRawNodeAttributes(dom);

	// removeAttributes(dom, old, attrs || EMPTY);
	for (var name in old) {
		if (!attrs || !(name in attrs)) {
			setAccessor(dom, name, null, old[name], isSvgMode);
		}
	}

	// new & updated
	if (attrs) {
		for (var name$1 in attrs) {
			if (!(name$1 in old) || attrs[name$1]!=old[name$1] || ((name$1===''value'' || name$1===''checked'') && attrs[name$1]!=dom[name$1])) {
				setAccessor(dom, name$1, attrs[name$1], old[name$1], isSvgMode);
			}
		}
	}
}

/** Retains a pool of Components for re-use, keyed on component name.
 *	Note: since component names are not unique or even necessarily available, these are primarily a form of sharding.
 *	@private
 */
var components = {};


function collectComponent(component) {
	var name = component.constructor.name,
		list = components[name];
	if (list) list.push(component);
	else components[name] = [component];
}


function createComponent(Ctor, props, context) {
	var inst = new Ctor(props, context),
		list = components[Ctor.name];
	inst.props = props;
	inst.context = context;
	if (list) {
		for (var i=list.length; i--; ) {
			if (list[i].constructor===Ctor) {
				inst.nextBase = list[i].nextBase;
				list.splice(i, 1);
				break;
			}
		}
	}
	return inst;
}

/** Mark component as dirty and queue up a render.
 *	@param {Component} component
 *	@private
 */
function triggerComponentRender(component) {
	if (!component._dirty) {
		component._dirty = true;
		enqueueRender(component);
	}
}



/** Set a component''s `props` (generally derived from JSX attributes).
 *	@param {Object} props
 *	@param {Object} [opts]
 *	@param {boolean} [opts.renderSync=false]	If `true` and {@link options.syncComponentUpdates} is `true`, triggers synchronous rendering.
 *	@param {boolean} [opts.render=true]			If `false`, no render will be triggered.
 */
function setComponentProps(component, props, opts, context, mountAll) {
	var b = component.base;
	if (component._disableRendering) return;
	component._disableRendering = true;

	if ((component.__ref = props.ref)) delete props.ref;
	if ((component.__key = props.key)) delete props.key;

	if (empty(b) || mountAll) {
		if (component.componentWillMount) component.componentWillMount();
	}
	else if (component.componentWillReceiveProps) {
		component.componentWillReceiveProps(props, context);
	}

	if (context && context!==component.context) {
		if (!component.prevContext) component.prevContext = component.context;
		component.context = context;
	}

	if (!component.prevProps) component.prevProps = component.props;
	component.props = props;

	component._disableRendering = false;

	if (opts!==NO_RENDER) {
		if (opts===SYNC_RENDER || options.syncComponentUpdates!==false || !b) {
			renderComponent(component, SYNC_RENDER, mountAll);
		}
		else {
			triggerComponentRender(component);
		}
	}

	if (component.__ref) component.__ref(component);
}



/** Render a Component, triggering necessary lifecycle events and taking High-Order Components into account.
 *	@param {Component} component
 *	@param {Object} [opts]
 *	@param {boolean} [opts.build=false]		If `true`, component will build and store a DOM node if not already associated with one.
 *	@private
 */
function renderComponent(component, opts, mountAll) {
	if (component._disableRendering) return;

	var skip, rendered,
		props = component.props,
		state = component.state,
		context = component.context,
		previousProps = component.prevProps || props,
		previousState = component.prevState || state,
		previousContext = component.prevContext || context,
		isUpdate = component.base,
		initialBase = isUpdate || component.nextBase,
		baseParent = initialBase && initialBase.parentNode,
		initialComponent = initialBase && initialBase._component,
		initialChildComponent = component._component;

	// if updating
	if (isUpdate) {
		component.props = previousProps;
		component.state = previousState;
		component.context = previousContext;
		if (opts!==FORCE_RENDER
			&& component.shouldComponentUpdate
			&& component.shouldComponentUpdate(props, state, context) === false) {
			skip = true;
		}
		else if (component.componentWillUpdate) {
			component.componentWillUpdate(props, state, context);
		}
		component.props = props;
		component.state = state;
		component.context = context;
	}

	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
	component._dirty = false;

	if (!skip) {
		if (component.render) rendered = component.render(props, state, context);

		// context to pass to the child, can be updated via (grand-)parent component
		if (component.getChildContext) {
			context = extend(clone(context), component.getChildContext());
		}

		while (isFunctionalComponent(rendered)) {
			rendered = buildFunctionalComponent(rendered, context);
		}

		var childComponent = rendered && rendered.nodeName,
			toUnmount, base;

		if (isFunction(childComponent) && childComponent.prototype.render) {
			// set up high order component link

			var inst = initialChildComponent,
				childProps = getNodeProps(rendered);

			if (inst && inst.constructor===childComponent) {
				setComponentProps(inst, childProps, SYNC_RENDER, context);
			}
			else {
				toUnmount = inst;
				inst = createComponent(childComponent, childProps, context);
				inst._parentComponent = component;
				component._component = inst;
				setComponentProps(inst, childProps, NO_RENDER, context);
				renderComponent(inst, SYNC_RENDER);
			}

			base = inst.base;
		}
		else {
			var cbase = initialBase;

			// destroy high order component link
			toUnmount = initialChildComponent;
			if (toUnmount) {
				cbase = component._component = null;
			}

			if (initialBase || opts===SYNC_RENDER) {
				if (cbase) cbase._component = null;
				base = diff(cbase, rendered, context, mountAll || !isUpdate, baseParent, true, initialBase && initialBase.nextSibling);
			}
		}

		if (initialBase && base!==initialBase) {
			if (!toUnmount && initialComponent===component && !initialChildComponent && initialBase.parentNode) {
				initialBase._component = null;
				recollectNodeTree(initialBase);
			}
		}

		if (toUnmount) {
			unmountComponent(toUnmount, true);
		}

		component.base = base;
		if (base) {
			var componentRef = component,
				t = component;
			while ((t=t._parentComponent)) { componentRef = t; }
			base._component = componentRef;
			base._componentConstructor = componentRef.constructor;
		}

	}

	if (!isUpdate || mountAll) {
		mounts.unshift(component);
		if (!diffLevel) flushMounts();
	}
	else if (!skip && component.componentDidUpdate) {
		component.componentDidUpdate(previousProps, previousState, previousContext);
	}

	var cb = component._renderCallbacks, fn;
	if (cb) while ( (fn = cb.pop()) ) fn.call(component);

	return rendered;
}



/** Apply the Component referenced by a VNode to the DOM.
 *	@param {Element} dom	The DOM node to mutate
 *	@param {VNode} vnode	A Component-referencing VNode
 *	@returns {Element} dom	The created/mutated element
 *	@private
 */
function buildComponentFromVNode(dom, vnode, context, mountAll) {
	var c = dom && dom._component,
		oldDom = dom,
		isDirectOwner = c && dom._componentConstructor===vnode.nodeName,
		isOwner = isDirectOwner,
		props = getNodeProps(vnode);
	while (c && !isOwner && (c=c._parentComponent)) {
		isOwner = c.constructor===vnode.nodeName;
	}

	if (isOwner && (!mountAll || c._component)) {
		setComponentProps(c, props, ASYNC_RENDER, context, mountAll);
		dom = c.base;
	}
	else {
		if (c && !isDirectOwner) {
			unmountComponent(c, true);
			dom = oldDom = null;
		}

		c = createComponent(vnode.nodeName, props, context);
		if (dom && !c.nextBase) c.nextBase = dom;
		setComponentProps(c, props, SYNC_RENDER, context, mountAll);
		dom = c.base;

		if (oldDom && dom!==oldDom) {
			oldDom._component = null;
			recollectNodeTree(oldDom);
		}
	}

	return dom;
}



/** Remove a component from the DOM and recycle it.
 *	@param {Element} dom			A DOM node from which to unmount the given Component
 *	@param {Component} component	The Component instance to unmount
 *	@private
 */
function unmountComponent(component, remove) {
	// console.log(`${remove?''Removing'':''Unmounting''} component: ${component.constructor.name}`);
	var base = component.base;

	component._disableRendering = true;

	if (component.componentWillUnmount) component.componentWillUnmount();

	component.base = null;

	// recursively tear down & recollect high-order component children:
	var inner = component._component;
	if (inner) {
		unmountComponent(inner, remove);
	}
	else if (base) {
		if (base[ATTR_KEY] && base[ATTR_KEY].ref) base[ATTR_KEY].ref(null);

		component.nextBase = base;

		if (remove) {
			removeNode(base);
			collectComponent(component);
		}
		removeOrphanedChildren(base.childNodes, !remove);
	}

	if (component.__ref) component.__ref(null);
	if (component.componentDidUnmount) component.componentDidUnmount();
}

/** Base Component class, for he ES6 Class method of creating Components
 *	@public
 *
 *	@example
 *	class MyFoo extends Component {
 *		render(props, state) {
 *			return <div />;
 *		}
 *	}
 */
function Component(props, context) {
	/** @private */
	this._dirty = true;
	/** @public */
	this._disableRendering = false;
	/** @public */
	this.prevState = this.prevProps = this.prevContext = this.base = this.nextBase = this._parentComponent = this._component = this.__ref = this.__key = this._linkedStates = this._renderCallbacks = null;
	/** @public */
	this.context = context;
	/** @type {object} */
	this.props = props;
	/** @type {object} */
	this.state = this.getInitialState && this.getInitialState() || {};
}


extend(Component.prototype, {

	/** Returns a `boolean` value indicating if the component should re-render when receiving the given `props` and `state`.
	 *	@param {object} nextProps
	 *	@param {object} nextState
	 *	@param {object} nextContext
	 *	@returns {Boolean} should the component re-render
	 *	@name shouldComponentUpdate
	 *	@function
	 */
	// shouldComponentUpdate() {
	// 	return true;
	// },


	/** Returns a function that sets a state property when called.
	 *	Calling linkState() repeatedly with the same arguments returns a cached link function.
	 *
	 *	Provides some built-in special cases:
	 *		- Checkboxes and radio buttons link their boolean `checked` value
	 *		- Inputs automatically link their `value` property
	 *		- Event paths fall back to any associated Component if not found on an element
	 *		- If linked value is a function, will invoke it and use the result
	 *
	 *	@param {string} key				The path to set - can be a dot-notated deep key
	 *	@param {string} [eventPath]		If set, attempts to find the new state value at a given dot-notated path within the object passed to the linkedState setter.
	 *	@returns {function} linkStateSetter(e)
	 *
	 *	@example Update a "text" state value when an input changes:
	 *		<input onChange={ this.linkState(''text'') } />
	 *
	 *	@example Set a deep state value on click
	 *		<button onClick={ this.linkState(''touch.coords'', ''touches.0'') }>Tap</button
	 */
	linkState: function linkState(key, eventPath) {
		var c = this._linkedStates || (this._linkedStates = {}),
			cacheKey = key + ''|'' + eventPath;
		return c[cacheKey] || (c[cacheKey] = createLinkedState(this, key, eventPath));
	},


	/** Update component state by copying properties from `state` to `this.state`.
	 *	@param {object} state		A hash of state properties to update with new values
	 */
	setState: function setState(state, callback) {
		var s = this.state;
		if (!this.prevState) this.prevState = clone(s);
		extend(s, isFunction(state) ? state(s, this.props) : state);
		if (callback) (this._renderCallbacks = (this._renderCallbacks || [])).push(callback);
		triggerComponentRender(this);
	},


	/** Immediately perform a synchronous re-render of the component.
	 *	@private
	 */
	forceUpdate: function forceUpdate() {
		renderComponent(this, FORCE_RENDER);
	},


	/** Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
	 *	Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
	 *	@param {object} props		Props (eg: JSX attributes) received from parent element/component
	 *	@param {object} state		The component''s current state
	 *	@param {object} context		Context object (if a parent component has provided context)
	 *	@returns VNode
	 */
	render: function render() {
		return null;
	}

});

// DOM properties that should NOT have "px" added when numeric
var NON_DIMENSION_PROPS$1 = {
	boxFlex:1, boxFlexGroup:1, columnCount:1, fillOpacity:1, flex:1, flexGrow:1,
	flexPositive:1, flexShrink:1, flexNegative:1, fontWeight:1, lineClamp:1, lineHeight:1,
	opacity:1, order:1, orphans:1, strokeOpacity:1, widows:1, zIndex:1, zoom:1
};

var ESC = {
	''<'': ''&lt;'',
	''>'': ''&gt;'',
	''"'': ''&quot;'',
	''&'': ''&amp;''
};

var objectKeys = Object.keys || (function (obj) {
	var keys = [];
	for (var i in obj) if (obj.hasOwnProperty(i)) keys.push(i);
	return keys;
});

var encodeEntities = function (s) { return String(s).replace(/[<>"&]/g, escapeChar); };

var escapeChar = function (a) { return ESC[a] || a; };

var falsey$1 = function (v) { return v==null || v===false; };

var memoize = function (fn, mem) {
	if ( mem === void 0 ) mem={};

	return function (v) { return mem[v] || (mem[v] = fn(v)); };
};

var indent = function (s, char) { return String(s).replace(/(\n+)/g, ''$1'' + (char || ''\t'')); };

var isLargeString = function (s, length, ignoreLines) { return (String(s).length>(length || 40) || (!ignoreLines && String(s).indexOf(''\n'')!==-1) || String(s).indexOf(''<'')!==-1); };

// Convert an Object style to a CSSText string
function styleObjToCss(s) {
	var str = '''';
	for (var prop in s) {
		var val = s[prop];
		if (val!=null) {
			if (str) str += '' '';
			str += jsToCss(prop);
			str += '': '';
			str += val;
			if (typeof val===''number'' && !NON_DIMENSION_PROPS$1[prop]) {
				str += ''px'';
			}
			str += '';'';
		}
	}
	return str;
}


// See https://github.com/developit/preact/blob/master/src/util.js#L61
function hashToClassName$1(c) {
	var str = '''';
	for (var prop in c) {
		if (c[prop]) {
			if (str) str += '' '';
			str += prop;
		}
	}
	return str;
}

// Convert a JavaScript camel-case CSS property name to a CSS property name
var jsToCss = memoize( function (s) { return s.replace(/([A-Z])/g,''-$1'').toLowerCase(); } );

function assign(obj, props) {
	for (var i in props) obj[i] = props[i];
	return obj;
}

function getNodeProps$1(vnode) {
	var defaultProps = vnode.nodeName.defaultProps,
		props = assign({}, defaultProps || vnode.attributes);
	if (defaultProps) assign(props, vnode.attributes);
	if (vnode.children) props.children = vnode.children;
	return props;
}

var SHALLOW = { shallow: true };

// components without names, kept as a hash for later comparison to return consistent UnnamedComponentXX names.
var UNNAMED = [];

var EMPTY$1 = {};

var VOID_ELEMENTS = [
	''area'',
	''base'',
	''br'',
	''col'',
	''embed'',
	''hr'',
	''img'',
	''input'',
	''link'',
	''meta'',
	''param'',
	''source'',
	''track'',
	''wbr''
];


/** Render Preact JSX + Components to an HTML string.
 *	@name render
 *	@function
 *	@param {VNode} vnode	JSX VNode to render.
 *	@param {Object} [context={}]	Optionally pass an initial context object through the render path.
 *	@param {Object} [options={}]	Rendering options
 *	@param {Boolean} [options.shallow=false]	If `true`, renders nested Components as HTML elements (`<Foo a="b" />`).
 *	@param {Boolean} [options.xml=false]		If `true`, uses self-closing tags for elements without children.
 *	@param {Boolean} [options.pretty=false]		If `true`, adds whitespace for readability
 */
renderToString.render = renderToString;


/** Only render elements, leaving Components inline as `<ComponentName ... />`.
 *	This method is just a convenience alias for `render(vnode, context, { shallow:true })`
 *	@name shallow
 *	@function
 *	@param {VNode} vnode	JSX VNode to render.
 *	@param {Object} [context={}]	Optionally pass an initial context object through the render path.
 */
var shallowRender = function (vnode, context) { return renderToString(vnode, context, SHALLOW); };


/** The default export is an alias of `render()`. */
function renderToString(vnode, context, opts, inner) {
	var ref = vnode || EMPTY$1;
	var nodeName = ref.nodeName;
	var attributes = ref.attributes;
	var children = ref.children;
	var isComponent = false;
	context = context || {};
	opts = opts || {};

	var pretty = opts.pretty,
		indentChar = typeof pretty===''string'' ? pretty : ''\t'';

	if (vnode==null) {
		return ''<!---->'';
	}

	// #text nodes
	if (!nodeName) {
		return encodeEntities(vnode);
	}

	// components
	if (typeof nodeName===''function'') {
		isComponent = true;
		if (opts.shallow && (inner || opts.renderRootComponent===false)) {
			nodeName = getComponentName(nodeName);
		}
		else {
			var props = getNodeProps$1(vnode),
				rendered;

			if (!nodeName.prototype || typeof nodeName.prototype.render!==''function'') {
				// stateless functional components
				rendered = nodeName(props, context);
			}
			else {
				// class-based components
				var c = new nodeName(props, context);
				c.props = props;
				c.context = context;
				if (c.componentWillMount) c.componentWillMount();
				rendered = c.render(c.props, c.state, c.context);

				if (c.getChildContext) {
					context = assign(assign({}, context), c.getChildContext());
				}
			}

			return renderToString(rendered, context, opts, opts.shallowHighOrder!==false);
		}
	}

	// render JSX to HTML
	var s = '''', html;

	if (attributes) {
		var attrs = objectKeys(attributes);

		// allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
		if (opts && opts.sortAttributes===true) attrs.sort();

		for (var i=0; i<attrs.length; i++) {
			var name = attrs[i],
				v = attributes[name];
			if (name===''children'') continue;
			if (!(opts && opts.allAttributes) && (name===''key'' || name===''ref'')) continue;

			if (name===''className'') {
				if (attributes[''class'']) continue;
				name = ''class'';
			}

			if (name===''class'' && v && typeof v===''object'') {
				v = hashToClassName$1(v);
			}
			else if (name===''style'' && v && typeof v===''object'') {
				v = styleObjToCss(v);
			}

			var hooked = opts.attributeHook && opts.attributeHook(name, v, context, opts, isComponent);
			if (hooked || hooked==='''') {
				s += hooked;
				continue;
			}

			if (name===''dangerouslySetInnerHTML'') {
				html = v && v.__html;
			}
			else if ((v || v===0) && typeof v!==''function'') {
				if (v===true) {
					v = name;
					// in non-xml mode, allow boolean attributes
					if (!opts || !opts.xml) {
						s += '' '' + name;
						continue;
					}
				}
				s += " " + name + "=\"" + (encodeEntities(v)) + "\"";
			}
		}
	}

	// account for >1 multiline attribute
	var sub = s.replace(/^\n\s*/, '' '');
	if (sub!==s && !~sub.indexOf(''\n'')) s = sub;
	else if (~s.indexOf(''\n'')) s += ''\n'';

	s = "<" + nodeName + s + ">";

	if (html) {
		// if multiline, indent.
		if (pretty && isLargeString(html)) {
			html = ''\n'' + indentChar + indent(html, indentChar);
		}
		s += html;
	}
	else {
		var len = children && children.length,
			pieces = [],
			hasLarge = ~s.indexOf(''\n'');
		for (var i$1=0; i$1<len; i$1++) {
			var child = children[i$1];
			if (!falsey$1(child)) {
				var ret = renderToString(child, context, opts, true);
				if (!hasLarge && pretty && isLargeString(ret)) hasLarge = true;
				pieces.push(ret);
			}
		}
		if (hasLarge) {
			for (var i$2=pieces.length; i$2--; ) {
				pieces[i$2] = ''\n'' + indentChar + indent(pieces[i$2], indentChar);
			}
		}
		if (pieces.length) {
			s += pieces.join('''');
		}
		else if (opts && opts.xml) {
			return s.substring(0, s.length-1) + '' />'';
		}
	}

	if (opts.jsx || VOID_ELEMENTS.indexOf(nodeName)===-1) {
		if (pretty && ~s.indexOf(''\n'')) s += ''\n'';
		s += "</" + nodeName + ">";
	}

	return s;
}

function getComponentName(component) {
	var proto = component.prototype,
		ctor = proto && proto.constructor;
	return component.displayName || component.name || (proto && (proto.displayName || proto.name)) || getFallbackComponentName(component);
}

function getFallbackComponentName(component) {
	var str = Function.prototype.toString.call(component),
		name = (str.match(/^\s*function\s+([^\( ]+)/) || EMPTY$1)[1];
	if (!name) {
		// search for an existing indexed name for the given component:
		var index = -1;
		for (var i=UNNAMED.length; i--; ) {
			if (UNNAMED[i]===component) {
				index = i;
				break;
			}
		}
		// not found, create a new indexed name:
		if (index<0) {
			index = UNNAMED.push(component) - 1;
		}
		name = "UnnamedComponent" + index;
	}
	return name;
}
renderToString.shallowRender = shallowRender;

var commonjsGlobal = typeof window !== ''undefined'' ? window : typeof global !== ''undefined'' ? global : typeof self !== ''undefined'' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === ''object'' && ''default'' in ex ? ex[''default''] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var compiledGrammar = createCommonjsModule(function (module, exports) {
/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a ''hash'' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,9],$V1=[1,10],$V2=[1,11],$V3=[1,12],$V4=[5,11,12,13,14,15];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"expressions":4,"EOF":5,"expression":6,"optional":7,"literal":8,"splat":9,"param":10,"(":11,")":12,"LITERAL":13,"SPLAT":14,"PARAM":15,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",11:"(",12:")",13:"LITERAL",14:"SPLAT",15:"PARAM"},
productions_: [0,[3,2],[3,1],[4,2],[4,1],[6,1],[6,1],[6,1],[6,1],[7,3],[8,1],[9,1],[10,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
return new yy.Root({},[$$[$0-1]])
break;
case 2:
return new yy.Root({},[new yy.Literal({value: ''''})])
break;
case 3:
this.$ = new yy.Concat({},[$$[$0-1],$$[$0]]);
break;
case 4: case 5:
this.$ = $$[$0];
break;
case 6:
this.$ = new yy.Literal({value: $$[$0]});
break;
case 7:
this.$ = new yy.Splat({name: $$[$0]});
break;
case 8:
this.$ = new yy.Param({name: $$[$0]});
break;
case 9:
this.$ = new yy.Optional({},[$$[$0-1]]);
break;
case 10:
this.$ = yytext;
break;
case 11: case 12:
this.$ = yytext.slice(1);
break;
}
},
table: [{3:1,4:2,5:[1,3],6:4,7:5,8:6,9:7,10:8,11:$V0,13:$V1,14:$V2,15:$V3},{1:[3]},{5:[1,13],6:14,7:5,8:6,9:7,10:8,11:$V0,13:$V1,14:$V2,15:$V3},{1:[2,2]},o($V4,[2,4]),o($V4,[2,5]),o($V4,[2,6]),o($V4,[2,7]),o($V4,[2,8]),{4:15,6:4,7:5,8:6,9:7,10:8,11:$V0,13:$V1,14:$V2,15:$V3},o($V4,[2,10]),o($V4,[2,11]),o($V4,[2,12]),{1:[2,1]},o($V4,[2,3]),{6:14,7:5,8:6,9:7,10:8,11:$V0,12:[1,16],13:$V1,14:$V2,15:$V3},o($V4,[2,9])],
defaultActions: {3:[2,2],13:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var this$1 = this;

    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '''', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this$1.yy, k)) {
            sharedState.yy[k] = this$1.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == ''undefined'') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === ''function'') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== ''number'') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this$1.defaultActions[state]) {
            action = this$1.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == ''undefined'') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === ''undefined'' || !action.length || !action[0]) {
                var errStr = '''';
                expected = [];
                for (p in table[state]) {
                    if (this$1.terminals_[p] && p > TERROR) {
                        expected.push(''\'''' + this$1.terminals_[p] + ''\'''');
                    }
                }
                if (lexer.showPosition) {
                    errStr = ''Parse error on line '' + (yylineno + 1) + '':\n'' + lexer.showPosition() + ''\nExpecting '' + expected.join('', '') + '', got \'''' + (this$1.terminals_[symbol] || symbol) + ''\'''';
                } else {
                    errStr = ''Parse error on line '' + (yylineno + 1) + '': Unexpected '' + (symbol == EOF ? ''end of input'' : ''\'''' + (this$1.terminals_[symbol] || symbol) + ''\'''');
                }
                this$1.parseError(errStr, {
                    text: lexer.match,
                    token: this$1.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error(''Parse Error: multiple actions possible at state: '' + state + '', token: '' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this$1.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this$1.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== ''undefined'') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this$1.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '''';
        this.conditionStack = [''INITIAL''];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError(''Lexical error on line '' + (this.yylineno + 1) + ''. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n'' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? ''...'':'''') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? ''...'' : '''')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var this$1 = this;

        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this$1[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        var this$1 = this;

        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '''';
            this.match = '''';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this$1._input.match(this$1.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this$1.options.backtrack_lexer) {
                    token = this$1.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this$1._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this$1.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError(''Lexical error on line '' + (this.yylineno + 1) + ''. Unrecognized text.\n'' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return "(";
break;
case 1:return ")";
break;
case 2:return "SPLAT";
break;
case 3:return "PARAM";
break;
case 4:return "LITERAL";
break;
case 5:return "LITERAL";
break;
case 6:return "EOF";
break;
}
},
rules: [/^(?:\()/,/^(?:\))/,/^(?:\*+\w+)/,/^(?::+\w+)/,/^(?:[\w%\-~\n]+)/,/^(?:.)/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (''function'' !== ''undefined'' && typeof exports !== ''undefined'') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
}
});

var compiledGrammar$1 = interopDefault(compiledGrammar);
var parse = compiledGrammar.parse;
var Parser = compiledGrammar.Parser;
var parser$2 = compiledGrammar.parser;

var require$$1 = Object.freeze({
  default: compiledGrammar$1,
  parse: parse,
  Parser: Parser,
  parser: parser$2
});

var nodes$1 = createCommonjsModule(function (module) {
''use strict'';
/** @module route/nodes */


/**
 * Create a node for use with the parser, giving it a constructor that takes
 * props, children, and returns an object with props, children, and a
 * displayName.
 * @param  {String} displayName The display name for the node
 * @return {{displayName: string, props: Object, children: Array}}
 */
function createNode(displayName) {
  return function(props, children) {
    return {
      displayName: displayName,
      props: props,
      children: children || []
    };
  };
}

module.exports = {
  Root: createNode(''Root''),
  Concat: createNode(''Concat''),
  Literal: createNode(''Literal''),
  Splat: createNode(''Splat''),
  Param: createNode(''Param''),
  Optional: createNode(''Optional'')
};
});

var nodes$2 = interopDefault(nodes$1);
var Root = nodes$1.Root;
var Concat = nodes$1.Concat;
var Literal = nodes$1.Literal;
var Splat = nodes$1.Splat;
var Param = nodes$1.Param;
var Optional = nodes$1.Optional;

var require$$0$1 = Object.freeze({
  default: nodes$2,
  Root: Root,
  Concat: Concat,
  Literal: Literal,
  Splat: Splat,
  Param: Param,
  Optional: Optional
});

var parser = createCommonjsModule(function (module) {
/**
 * @module route/parser
 */
''use strict'';

/** Wrap the compiled parser with the context to create node objects */
var parser = interopDefault(require$$1).parser;
parser.yy = interopDefault(require$$0$1);
module.exports = parser;
});

var parser$1 = interopDefault(parser);


var require$$2 = Object.freeze({
	default: parser$1
});

var create_visitor = createCommonjsModule(function (module) {
''use strict'';
/**
 * @module route/visitors/create_visitor
 */

var nodeTypes = Object.keys(interopDefault(require$$0$1));

/**
 * Helper for creating visitors. Take an object of node name to handler
 * mappings, returns an object with a "visit" method that can be called
 * @param  {Object.<string,function(node,context)>} handlers A mapping of node
 * type to visitor functions
 * @return {{visit: function(node,context)}}  A visitor object with a "visit"
 * method that can be called on a node with a context
 */
function createVisitor(handlers) {
  nodeTypes.forEach(function(nodeType) {
    if( typeof handlers[nodeType] === ''undefined'') {
      throw new Error(''No handler defined for '' + nodeType.displayName);
    }

  });

  return {
    /**
     * Call the given handler for this node type
     * @param  {Object} node    the AST node
     * @param  {Object} context context to pass through to handlers
     * @return {Object}
     */
    visit: function(node, context) {
      return this.handlers[node.displayName].call(this,node, context);
    },
    handlers: handlers
  };
}

module.exports = createVisitor;
});

var create_visitor$1 = interopDefault(create_visitor);


var require$$0$2 = Object.freeze({
  default: create_visitor$1
});

var regexp = createCommonjsModule(function (module) {
''use strict'';

var createVisitor  = interopDefault(require$$0$2),
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

/**
 * @class
 * @private
 */
function Matcher(options) {
  this.captures = options.captures;
  this.re = options.re;
}

/**
 * Try matching a path against the generated regular expression
 * @param  {String} path The path to try to match
 * @return {Object|false}      matched parameters or false
 */
Matcher.prototype.match = function (path) {
  var match = this.re.exec(path),
      matchParams = {};

  if( !match ) {
    return;
  }

  this.captures.forEach( function(capture, i) {
    if( typeof match[i+1] === ''undefined'' ) {
      matchParams[capture] = undefined;
    }
    else {
      matchParams[capture] = decodeURIComponent(match[i+1]);
    }
  });

  return matchParams;
};

/**
 * Visitor for the AST to create a regular expression matcher
 * @class RegexpVisitor
 * @borrows Visitor-visit
 */
var RegexpVisitor = createVisitor({
  ''Concat'': function(node) {
    return node.children
      .reduce(
        function(memo, child) {
          var childResult = this.visit(child);
          return {
            re: memo.re + childResult.re,
            captures: memo.captures.concat(childResult.captures)
          };
        }.bind(this),
        {re: '''', captures: []}
      );
  },
  ''Literal'': function(node) {
    return {
      re: node.props.value.replace(escapeRegExp, ''\\$&''),
      captures: []
    };
  },

  ''Splat'': function(node) {
    return {
      re: ''([^?]*?)'',
      captures: [node.props.name]
    };
  },

  ''Param'': function(node) {
    return {
      re: ''([^\\/\\?]+)'',
      captures: [node.props.name]
    };
  },

  ''Optional'': function(node) {
    var child = this.visit(node.children[0]);
    return {
      re: ''(?:'' + child.re + '')?'',
      captures: child.captures
    };
  },

  ''Root'': function(node) {
    var childResult = this.visit(node.children[0]);
    return new Matcher({
      re: new RegExp(''^'' + childResult.re + ''(?=\\?|$)'' ),
      captures: childResult.captures
    });
  }
});

module.exports = RegexpVisitor;
});

var regexp$1 = interopDefault(regexp);


var require$$1$1 = Object.freeze({
  default: regexp$1
});

var reverse = createCommonjsModule(function (module) {
''use strict'';

var createVisitor  = interopDefault(require$$0$2);

/**
 * Visitor for the AST to construct a path with filled in parameters
 * @class ReverseVisitor
 * @borrows Visitor-visit
 */
var ReverseVisitor = createVisitor({
  ''Concat'': function(node, context) {
    var childResults =  node.children
      .map( function(child) {
        return this.visit(child,context);
      }.bind(this));

    if( childResults.some(function(c) { return c === false; }) ) {
      return false;
    }
    else {
      return childResults.join('''');
    }
  },

  ''Literal'': function(node) {
    return decodeURI(node.props.value);
  },

  ''Splat'': function(node, context) {
    if( context[node.props.name] ) {
      return context[node.props.name];
    }
    else {
      return false;
    }
  },

  ''Param'': function(node, context) {
    if( context[node.props.name] ) {
      return context[node.props.name];
    }
    else {
      return false;
    }
  },

  ''Optional'': function(node, context) {
    var childResult = this.visit(node.children[0], context);
    if( childResult ) {
      return childResult;
    }
    else {
      return '''';
    }
  },

  ''Root'': function(node, context) {
    context = context || {};
    var childResult = this.visit(node.children[0], context);
    if( !childResult ) {
      return false;
    }
    return encodeURI(childResult);
  }
});

module.exports = ReverseVisitor;
});

var reverse$1 = interopDefault(reverse);


var require$$0$3 = Object.freeze({
  default: reverse$1
});

var route = createCommonjsModule(function (module) {
''use strict'';
var Parser = interopDefault(require$$2),
    RegexpVisitor = interopDefault(require$$1$1),
    ReverseVisitor = interopDefault(require$$0$3);

Route.prototype = Object.create(null)

/**
 * Match a path against this route, returning the matched parameters if
 * it matches, false if not.
 * @example
 * var route = new Route(''/this/is/my/route'')
 * route.match(''/this/is/my/route'') // -> {}
 * @example
 * var route = new Route(''/:one/:two'')
 * route.match(''/foo/bar/'') // -> {one: ''foo'', two: ''bar''}
 * @param  {string} path the path to match this route against
 * @return {(Object.<string,string>|false)} A map of the matched route
 * parameters, or false if matching failed
 */
Route.prototype.match = function(path) {
  var re = RegexpVisitor.visit(this.ast),
      matched = re.match(path);

  return matched ? matched : false;

};

/**
 * Reverse a route specification to a path, returning false if it can''t be
 * fulfilled
 * @example
 * var route = new Route(''/:one/:two'')
 * route.reverse({one: ''foo'', two: ''bar''}) -> ''/foo/bar''
 * @param  {Object} params The parameters to fill in
 * @return {(String|false)} The filled in path
 */
Route.prototype.reverse = function(params) {
  return ReverseVisitor.visit(this.ast, params);
};

/**
 * Represents a route
 * @example
 * var route = Route(''/:foo/:bar'');
 * @example
 * var route = Route(''/:foo/:bar'');
 * @param {string} spec -  the string specification of the route.
 *     use :param for single portion captures, *param for splat style captures,
 *     and () for optional route branches
 * @constructor
 */
function Route(spec) {
  var route;
  if (this) {
    // constructor called with new
    route = this;
  } else {
    // constructor called as a function
    route = Object.create(Route.prototype);
  }
  if( typeof spec === ''undefined'' ) {
    throw new Error(''A route spec is required'');
  }
  route.spec = spec;
  route.ast = Parser.parse(spec);
  return route;
}

module.exports = Route;
});

var route$1 = interopDefault(route);


var require$$0 = Object.freeze({
  default: route$1
});

var index = createCommonjsModule(function (module) {
/**
 * @module Passage
 */
''use strict'';

var Route = interopDefault(require$$0);


module.exports = Route;
});

var Route = interopDefault(index);

var punycode = createCommonjsModule(function (module, exports) {
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == ''object'' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == ''object'' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof commonjsGlobal == ''object'' && commonjsGlobal;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = ''-'', // ''\x2D''

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		''overflow'': ''Overflow: input needs wider integers to process'',
		''not-basic'': ''Illegal input >= 0x80 (not a basic code point)'',
		''invalid-input'': ''Invalid input''
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split(''@'');
		var result = '''';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + ''@'';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, ''\x2E'');
		var labels = string.split(''.'');
		var encoded = map(labels, fn).join(''.'');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '''';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('''');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don''t use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it''s not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error(''not-basic'');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error(''invalid-input'');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error(''overflow'');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error(''overflow'');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we''ll fix that now:
			if (floor(i / out) > maxInt - n) {
				error(''overflow'');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder''s <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error(''overflow'');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error(''overflow'');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('''');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn''t matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn''t matter if you call it with a domain that''s already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? ''xn--'' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		''version'': ''1.3.2'',
		/**
		 * An object of methods to convert from JavaScript''s internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		''ucs2'': {
			''decode'': ucs2decode,
			''encode'': ucs2encode
		},
		''decode'': decode,
		''encode'': encode,
		''toASCII'': toASCII,
		''toUnicode'': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == ''function'' &&
		typeof define.amd == ''object'' &&
		define.amd
	) {
		define(''punycode'', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(commonjsGlobal));
});

var punycode$1 = interopDefault(punycode);


var require$$2$1 = Object.freeze({
	default: punycode$1
});

var util = createCommonjsModule(function (module) {
''use strict'';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === ''string'';
  },
  isObject: function(arg) {
    return typeof(arg) === ''object'' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};
});

var util$1 = interopDefault(util);
var isString$1 = util.isString;
var isObject = util.isObject;
var isNull = util.isNull;
var isNullOrUndefined = util.isNullOrUndefined;

var require$$1$2 = Object.freeze({
  default: util$1,
  isString: isString$1,
  isObject: isObject,
  isNull: isNull,
  isNullOrUndefined: isNullOrUndefined
});

var decode$1 = createCommonjsModule(function (module) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

''use strict'';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || ''&'';
  eq = eq || ''='';
  var obj = {};

  if (typeof qs !== ''string'' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === ''number'') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, ''%20''),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '''';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};
});

var decode$2 = interopDefault(decode$1);


var require$$1$3 = Object.freeze({
  default: decode$2
});

var encode$1 = createCommonjsModule(function (module) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

''use strict'';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case ''string'':
      return v;

    case ''boolean'':
      return v ? ''true'' : ''false'';

    case ''number'':
      return isFinite(v) ? v : '''';

    default:
      return '''';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || ''&'';
  eq = eq || ''='';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === ''object'') {
    return Object.keys(obj).map(function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (Array.isArray(obj[k])) {
        return obj[k].map(function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '''';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};
});

var encode$2 = interopDefault(encode$1);


var require$$0$5 = Object.freeze({
  default: encode$2
});

var index$1 = createCommonjsModule(function (module, exports) {
''use strict'';

exports.decode = exports.parse = interopDefault(require$$1$3);
exports.encode = exports.stringify = interopDefault(require$$0$5);
});

var index$2 = interopDefault(index$1);
var encode = index$1.encode;
var stringify = index$1.stringify;
var decode = index$1.decode;
var parse$2 = index$1.parse;

var require$$0$4 = Object.freeze({
	default: index$2,
	encode: encode,
	stringify: stringify,
	decode: decode,
	parse: parse$2
});

var url = createCommonjsModule(function (module, exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

''use strict'';

var punycode = interopDefault(require$$2$1);
var util = interopDefault(require$$1$2);

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = [''<'', ''>'', ''"'', ''`'', '' '', ''\r'', ''\n'', ''\t''],

    // RFC 2396: characters not allowed for various reasons.
    unwise = [''{'', ''}'', ''|'', ''\\'', ''^'', ''`''].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = [''\''''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = [''%'', ''/'', ''?'', '';'', ''#''].concat(autoEscape),
    hostEndingChars = [''/'', ''?'', ''#''],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      ''javascript'': true,
      ''javascript:'': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      ''javascript'': true,
      ''javascript:'': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      ''http'': true,
      ''https'': true,
      ''ftp'': true,
      ''gopher'': true,
      ''file'': true,
      ''http:'': true,
      ''https:'': true,
      ''ftp:'': true,
      ''gopher:'': true,
      ''file:'': true
    },
    querystring = interopDefault(require$$0$4);

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  var this$1 = this;

  if (!util.isString(url)) {
    throw new TypeError("Parameter ''url'' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf(''?''),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf(''#'')) ? ''?'' : ''#'',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, ''/'');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split(''#'').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '''';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it''s got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that''s
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === ''//'';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there''s a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf(''@'');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf(''@'', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we''ve indicated that there is a hostname,
    // so even if it''s empty, it has to be present.
    this.hostname = this.hostname || '''';

    // if hostname begins with [ and ends with ]
    // assume that it''s an IPv6 address.
    var ipv6Hostname = this.hostname[0] === ''['' &&
        this.hostname[this.hostname.length - 1] === '']'';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '''';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += ''x'';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = ''/'' + notHost.join(''.'') + rest;
            }
            this$1.hostname = validParts.join(''.'');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '''';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn''t matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? '':'' + this.port : '''';
    var h = this.hostname || '''';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== ''/'') {
        rest = ''/'' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn''t think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf(''#'');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf(''?'');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '''';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = ''/'';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '''';
    var s = this.search || '''';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it''s an object, and not a string url.
  // If it''s an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '''';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, '':'');
    auth += ''@'';
  }

  var protocol = this.protocol || '''',
      pathname = this.pathname || '''',
      hash = this.hash || '''',
      host = false,
      query = '''';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf('':'') === -1 ?
        this.hostname :
        ''['' + this.hostname + '']'');
    if (this.port) {
      host += '':'' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && (''?'' + query)) || '''';

  if (protocol && protocol.substr(-1) !== '':'') protocol += '':'';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = ''//'' + (host || '''');
    if (pathname && pathname.charAt(0) !== ''/'') pathname = ''/'' + pathname;
  } else if (!host) {
    host = '''';
  }

  if (hash && hash.charAt(0) !== ''#'') hash = ''#'' + hash;
  if (search && search.charAt(0) !== ''?'') search = ''?'' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace(''#'', ''%23'');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  var this$1 = this;

  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this$1[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there''s nothing left to do here.
  if (relative.href === '''') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== ''protocol'')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = ''/'';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it''s a known url protocol, then changing
    // the protocol does weird things
    // first, if it''s not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that''s known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '''').split(''/'');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '''';
      if (!relative.hostname) relative.hostname = '''';
      if (relPath[0] !== '''') relPath.unshift('''');
      if (relPath.length < 2) relPath.unshift('''');
      result.pathname = relPath.join(''/'');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '''';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '''';
      var s = result.search || '''';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === ''/''),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === ''/''
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split(''/'') || [],
      relPath = relative.pathname && relative.pathname.split(''/'') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '''';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '''') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '''';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '''') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '''' || srcPath[0] === '''');
  }

  if (isRelAbs) {
    // it''s absolute.
    result.host = (relative.host || relative.host === '''') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '''') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it''s relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href=''?foo''.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject(''mailto:local1@domain1'', ''local2@domain2'')
      var authInHost = result.host && result.host.indexOf(''@'') > 0 ?
                       result.host.split(''@'') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '''') +
                    (result.search ? result.search : '''');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we''ve already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = ''/'' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === ''.'' || last === ''..'') || last === '''');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === ''.'') {
      srcPath.splice(i, 1);
    } else if (last === ''..'') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift(''..'');
    }
  }

  if (mustEndAbs && srcPath[0] !== '''' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== ''/'')) {
    srcPath.unshift('''');
  }

  if (hasTrailingSlash && (srcPath.join(''/'').substr(-1) !== ''/'')) {
    srcPath.push('''');
  }

  var isAbsolute = srcPath[0] === '''' ||
      (srcPath[0] && srcPath[0].charAt(0) === ''/'');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '''' :
                                    srcPath.length ? srcPath.shift() : '''';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject(''mailto:local1@domain1'', ''local2@domain2'')
    var authInHost = result.host && result.host.indexOf(''@'') > 0 ?
                     result.host.split(''@'') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('''');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join(''/'');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '''') +
                  (result.search ? result.search : '''');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== '':'') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};
});

var url$1 = interopDefault(url);

var NoMatchError = (function (Error) {
    function NoMatchError() {
        Error.call(this);
        this.code = ''NO_MATCH'';
    }

    if ( Error ) NoMatchError.__proto__ = Error;
    NoMatchError.prototype = Object.create( Error && Error.prototype );
    NoMatchError.prototype.constructor = NoMatchError;

    return NoMatchError;
}(Error));

var RedirectError = (function (Error) {
    function RedirectError(statusCode, url) {
        this.statusCode = statusCode;
        this.redirectToUrl = url;
        this.code = ''REDIRECT'';
    }

    if ( Error ) RedirectError.__proto__ = Error;
    RedirectError.prototype = Object.create( Error && Error.prototype );
    RedirectError.prototype.constructor = RedirectError;

    return RedirectError;
}(Error));

var Router = function Router(routesToAdd) {
    var this$1 = this;

    this.routes = [];

    for (var urlPattern in routesToAdd) {
        var route = Route(urlPattern);
        this$1.routes.push({
            route: route,
            func: routesToAdd[urlPattern]
        })
    } 
};

Router.prototype.dispatch = function dispatch (urlToDispatch) {
        var this$1 = this;

    return Promise.resolve()
    .then(function () {
        var args = {
            url: urlToDispatch
        };

        for (var x = 0; x < this$1.routes.length; x++) {
            var ref = this$1.routes[x];
                var route = ref.route;
                var func = ref.func;
            var match = route.match(urlToDispatch)
                
            if (match) {
                console.log(''GOT MATCH'')
                args.params = match;
                return Promise.resolve(func(args))
            }
        }

        var parsed = url$1.parse(urlToDispatch);
        var pathSplit = parsed.pathname.split(''/'');
            
        if (pathSplit[pathSplit.length - 1].indexOf(".") == -1) {
            // maybe it''s a URL that needs a / appended to the end

            var withSlash = urlToDispatch + "/";

            var hasMatch = this$1.routes.some(function (ref) {
                    var route = ref.route;

                return route.match(withSlash)
            })

            if (hasMatch) {
                throw new RedirectError(301, withSlash);
            }

        }

        var err = new NoMatchError("Could not find URL match for:" + urlToDispatch);
        throw err;
    })

        
};

var client = createCommonjsModule(function (module) {
module.exports = function (command, data) {
    
    // Wrap our postMessage in a promise to allow us to chain commands and
    // responses together.
   
    return new Promise(function (fulfill, reject) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function (event) {
            var ref = event.data;
            var err = ref[0];
            var data = ref[1];
            if (err) {
                return reject(err);
            }
            
            fulfill(data);
        };
        
        var dataAsString = JSON.stringify(data);
      
        navigator.serviceWorker.ready.then(function (reg) {
            console.info(("Sending " + command + " to service worker..."), data);
            reg.active.postMessage({
                action: "runCommand",
                command: command,
                dataAsString: dataAsString
            }, [messageChannel.port2]);
        })
        
    })
}
});

var runServiceWorkerCommand = interopDefault(client);

function checkNotificationPermission () {
    return new Promise(function (fulfill, reject) {
        if (window.Notification.permission === ''granted'') {
            return fulfill(true);
        }
        Notification.requestPermission(function (status) {
            if (status === ''granted'') {
                return fulfill(true);
            }
            reject(new Error(status))
        })
    });
};

var RemoteNotify = (function (Component) {
    function RemoteNotify () {
        Component.apply(this, arguments);
    }

    if ( Component ) RemoteNotify.__proto__ = Component;
    RemoteNotify.prototype = Object.create( Component && Component.prototype );
    RemoteNotify.prototype.constructor = RemoteNotify;

    RemoteNotify.prototype.render = function render () {

        var buttonClass = ["button"];

        if (this.state.isSubscribed) {
            buttonClass.push("subscribed");
        }

        return (
            h( ''div'', { class: buttonClass.join(" "), onClick: this.subscribeOrUnsubscribe.bind(this) }, "Subscribe to test topic")
        )
    };

    RemoteNotify.prototype.subscribeOrUnsubscribe = function subscribeOrUnsubscribe () {
        if (window.localStorage["test_subscribed"]) {
            return this.unsubscribe();
        }

        return this.subscribeToTestTopic()
    };

    RemoteNotify.prototype.subscribeToTestTopic = function subscribeToTestTopic () {
        var this$1 = this;

        return checkNotificationPermission()
        .then(function () {
            return navigator.serviceWorker.ready
        })
        .then(function (reg) {
            console.log("got reg, sending pushmanager subscribe")
            return reg.pushManager.subscribe({userVisibleOnly: true})
            .then(function () {
                return runServiceWorkerCommand(''pushkinFirebase.subscribeToTopic'', {
                    topic: ''app-demo-test'',
                    confirmationNotification: {
                        ttl: 60,
                        payload: [{
                            command: "notification.show",
                            options: {
                                title: "Subscription confirmation",
                                options: {
                                    body: "This confirms that you have successfully subscribed to the topic."
                                }
                            }
                        }],
                        service_worker_url: reg.active.scriptURL,
                        priority: ''high''
                    }
                });
            });
        })
        .then(function () {
            window.localStorage["test_subscribed"] = true;
            this$1.setState({
                isSubscribed: true
            });
        })
        .catch(function (err) {
            console.error(err)
        })
    };

    RemoteNotify.prototype.unsubscribe = function unsubscribe () {
        var this$1 = this;

        console.log(''unsub'')
        return runServiceWorkerCommand(''pushkinFirebase.unsubscribeFromTopic'', {
            topic: ''app-demo-test''
        })
        .then(function () {
            window.localStorage.removeItem("test_subscribed");
            this$1.setState({
                isSubscribed: false
            });
        })
    };

    RemoteNotify.prototype.componentDidMount = function componentDidMount () {
        this.setState({
            isSubscribed: window.localStorage["test_subscribed"]
        })
    };

    return RemoteNotify;
}(Component));

var basePath = "/reader";
var notificationCommandsSettings = {"pushkinFirebase":{"host":"https://www.stg.gdnmobilelab.com/push","key":"72jjNOveYYdWc2Opv6a8Ipi6eMuO468e"}};
var config = {
	basePath: basePath,
	notificationCommandsSettings: notificationCommandsSettings
};

function Layout (props) {

    var backButton = null;
    var containerClasses = "mdl-layout mdl-layout--fixed-header";

    if (props.defaultBackURL) {
        backButton = h( ''a'', { href: props.defaultBackURL, class: "mdl-layout__drawer-button" },
          h( ''i'', { class: "material-icons" }, "arrow_back")
          );
    } else {
        containerClasses += " mdl-layout--no-drawer-button";
    }

    
    return h( ''div'', { class: containerClasses },
        h( ''header'', { class: "mdl-layout__header" },
            backButton,
            h( ''div'', { class: "mdl-layout__header-row" },
                
                h( ''span'', { class: "mdl-layout-title" }, props.title)
            )
        ),
        h( ''main'', { class: "mdl-layout__content" },
        props.children
        )
    )
}

var wrapInHTML = function (content, props) {

    var prefix = "/";
    if (config.basePath) {
        prefix = config.basePath;
    }

    var backURLTag = null;

    if (props.defaultBackURL) {
        backURLTag = h( ''meta'', { name: "default-back-url", content: props.defaultBackURL })
    }

    var classCheckScript = "\n        if (typeof navigator !== \"undefined\" && navigator.userAgent.indexOf(\"hybridwebview\") > -1) {\n            document.documentElement.className = \"ios-hybrid\"\n        }\n    ";

    return (
        h( ''html'', null,
            h( ''head'', null,
                h( ''title'', null, props.title ),
                h( ''link'', { href: "https://fonts.googleapis.com/icon?family=Material+Icons", rel: "stylesheet" }),
                h( ''link'', { rel: "manifest", href: "./manifest.json" }),
                h( ''link'', { rel: "stylesheet", href: prefix + "/styles.css", type: "text/css" }),
                h( ''meta'', { name: "viewport", content: "width=device-width, initial-scale=1,user-scalable=no" }),
                h( ''meta'', { name: "theme-color", content: props.themeColor || "#0D6292" }),
                h( ''meta'', { charset: "utf-8" }),  
                backURLTag,
                h( ''script'', { dangerouslySetInnerHTML: {__html: classCheckScript} })
            ),
            h( ''body'', null,
            h( ''div'', { id: "main" },
                content
            )
            ),
            h( ''script'', { src: prefix + "/client.js", async: true }),
            h( ''script'', { async: true },
                ("navigator.serviceWorker.register(''" + prefix + "/sw.js'', {scope: ''" + prefix + "/''});")
            )
        )
    )
}

function PageWrapper (props) {

    var content = (
        h( Layout, props,
            props.children
        )
    );

    if (typeof window !== "undefined") {
        return content;
    } else {
        return wrapInHTML(content, props);
    }
}

var StoryList = (function (Component) {
    function StoryList () {
        Component.apply(this, arguments);
    }

    if ( Component ) StoryList.__proto__ = Component;
    StoryList.prototype = Object.create( Component && Component.prototype );
    StoryList.prototype.constructor = StoryList;

    StoryList.prototype.render = function render () {
        if (this.props.stories.length == 0) {
            return h( ''p'', null, "No stories found." )
        }
        console.log(''number of stories'', this.props.stories.length)
        var stories = this.props.stories
            .sort(function (a,b) { return b.publish_date - a.publish_date; })
            .map(function (story) {

                var titleCard = null;

                if (story.image) {
                    titleCard = h( ''span'', { class: "mdl-card__title mdl-card--expand img", style: {backgroundImage: "url(" + story.image + ")"} });
                } else {
                    titleCard = h( ''span'', { class: "mdl-card__title mdl-card--expand img" })
                }


                return h( ''a'', { class: "story-card-image mdl-card mdl-shadow--2dp", href: "articles/" + story.id },
                    titleCard,
                    h( ''span'', { class: "mdl-card__actions" },
                        h( ''span'', { class: "author" }, story.author),
                        h( ''span'', { class: "demo-card-image__filename" }, story.title)
                    )
                )
            })

        return h( ''div'', null, stories )
    };

    return StoryList;
}(Component));

var StatusPopup = (function (Component) {
    function StatusPopup() {
        Component.call(this);
        this.transitionend = this.transitionend.bind(this);
    }

    if ( Component ) StatusPopup.__proto__ = Component;
    StatusPopup.prototype = Object.create( Component && Component.prototype );
    StatusPopup.prototype.constructor = StatusPopup;

    StatusPopup.prototype.render = function render () {
        if (this.props.show !== true && this.state.isAnimating !== true) {
            return null;
        }

        var classes = [''status-popup''];

        if (this.state.addShowClass === true) {
            classes.push(''show'');
        }

        return h( ''div'', { class: classes.join('' '') },
            h( ''div'', { class: ''inner'' },
                this.props.message
            )
        )
    };

    StatusPopup.prototype.renderCheck = function renderCheck () {
        if (!this.base) return;

        if (this.props.show === true && this.state.addShowClass !== true) {
            // seems to enforce it draws on the screen, so we get our animation
            window.getComputedStyle(this.base).transform;
            this.setState({
                addShowClass: true
            })
        }
    };

    StatusPopup.prototype.componentDidMount = function componentDidMount () {
       this.renderCheck();
    };

    StatusPopup.prototype.componentDidUpdate = function componentDidUpdate () {
        this.renderCheck();
    };

    StatusPopup.prototype.componentWillUpdate = function componentWillUpdate (newProps) {
        if (newProps.show !== true && this.props.show === true) {
            this.setState({
                isAnimating: true,
                addShowClass: false
            });

            this.base.addEventListener(''transitionend'', this.transitionend);
        }
    };

    StatusPopup.prototype.transitionend = function transitionend () {
        this.base.removeEventListener(''transitionend'', this.transitionend);
        this.setState({
            isAnimating: false
        })
    };

    return StatusPopup;
}(Component));

var executeCommand = null;

function runCommand(command, opts) {
    if (executeCommand === null) {
        throw new Error("Tried to run command without binding a run function");
    }
    return executeCommand(command, opts);
}

function setRunFunction(func) {
    executeCommand = func;
}

var Homepage = (function (Component) {
   function Homepage(props) {
        this.state = {
            stories: props.existingStories
        }
    }

   if ( Component ) Homepage.__proto__ = Component;
   Homepage.prototype = Object.create( Component && Component.prototype );
   Homepage.prototype.constructor = Homepage;

    Homepage.prototype.render = function render () {
        return h( ''div'', null,
            h( ''p'', null, "We are an innovation team in the Guardian US newsroom exploring storytelling and delivering news on small screens." ),
            h( ''p'', null, "We''ll be using this app to send you our latest experiment as and when we do them, but in the mean time, take a read of the experiments we''ve run before:" ),
            
            h( StoryList, { stories: this.state.stories }),
            h( StatusPopup, { message: "Checking for new stories...", show: this.state.checking })
        )
    };

    Homepage.prototype.componentDidMount = function componentDidMount () {
        var this$1 = this;

        this.setState({
            checking: true
        })
        runCommand(''reader.checkForNew'')
        .then(function (allItems) {
            this$1.setState({
                stories: allItems,
                checking: false
            });
        })
        
    };

   return Homepage;
}(Component));

function root (e) {
    return runCommand("treo.getFromStore", {
        store: "stories"
    })
    .then(function (allStories) {
        return h( PageWrapper, { url: e.url, title: "Guardian Mobile Innovation Lab" },
            h( Homepage, { existingStories: allStories })
        )
    })
   
}

var Article = (function (Component) {
    function Article () {
        Component.apply(this, arguments);
    }

    if ( Component ) Article.__proto__ = Component;
    Article.prototype = Object.create( Component && Component.prototype );
    Article.prototype.constructor = Article;

    Article.prototype.render = function render () {
        return h( ''div'', { class: "article" },
            h( ''h1'', null, this.props.title ),
            h( ''div'', { dangerouslySetInnerHTML: {__html: this.props.content}, onClick: this.processClick })
        )
    };

    Article.prototype.processClick = function processClick (e) {
        if (e.target.tagName.toLowerCase() !== "a") {
            return
        }

        if (e.target.hostname !== window.location.hostname) {
            e.target.target = "_blank";
        }
    };

    return Article;
}(Component));

function article (e) {
    return runCommand("treo.getFromStore", {
        store: "stories",
        id: e.params.id
    })
    .then(function (article) {
        console.log(''get response'')
        return h( PageWrapper, { url: e.url, title: article.title, defaultBackURL: ''../'' },
            h( Article, article)
        )
    })
    
}

var routes = {
    ''/'': root,
    ''/articles/:id'': article
};

var serviceWorker = createCommonjsModule(function (module) {
var boundFuncs = {};

self.addEventListener(''message'', function(event){
    
    if (event.data.action !== "runCommand") {
        // allow other types of messages if needed
        return;
    }
    
    var ret = function (err, data) {
        event.ports[0].postMessage([err, data]);
    }
   
    var ref = event.data;
    var command = ref.command;
    var dataAsString = ref.dataAsString;
    
    var data = null;
    if (dataAsString) {
        data = JSON.parse(dataAsString);
    }

    module.exports.run(command, data)
    .then(function (data) {
        console.info(("Service worker replying to " + command + "..."), data);
        event.ports[0].postMessage([null, data]);
    })
    .catch(function (err) {
        console.error(("Service worker replying with error to " + command + "..."), err);
        event.ports[0].postMessage([err.toString(), null]);  
    })
    
});

module.exports = {
    bind: function bind(command, func) {
        if (boundFuncs[command]) {
            throw new Error("Already have a function bound to " + command);
        }
        boundFuncs[command] = func;
    },
    bindAll: function bindAll(obj) {
        for (key in obj) {
            module.exports.bind(key, obj[key]);
        }
    },
    unbind: function unbind(command, func) {
        if (boundFuncs[command] !== func) {
            throw new Error(("Trying to unbind function from " + command + " when it is not bound."))
        }
        boundFuncs[command] = null;
    },
    run: function run(command, data) {
        if (!boundFuncs[command]) {
            throw new Error("Tried to execute " + command + ", but it is not bound");
        }

        return Promise.resolve(boundFuncs[command](data))
    }
};
});

var swBridge = interopDefault(serviceWorker);

var getRegistration = createCommonjsModule(function (module) {
// Different when inside and outside of a service worker.
// Need to finish - Service Worker code only for now.

module.exports = function() {
    return self.registration;
}
});

var getRegistration$1 = interopDefault(getRegistration);


var require$$1$4 = Object.freeze({
    default: getRegistration$1
});

var config$1 = createCommonjsModule(function (module) {
var config = {};

module.exports = config;

module.exports.update = function (newConfig) {
    Object.assign(config, newConfig);
}
});

var config$2 = interopDefault(config$1);
var update = config$1.update;

var require$$0$6 = Object.freeze({
    default: config$2,
    update: update
});

var pushy = createCommonjsModule(function (module) {
var getRegistration = interopDefault(require$$1$4);
var config = interopDefault(require$$0$6);

var pushyRequest = function(endpoint, method, body) {
    if ( method === void 0 ) method = ''GET'';
    if ( body === void 0 ) body = '''';

   
    if (!config.pushy || !config.pushy.key || !config.pushy.host) {
        throw new Error("Must set both pushy key and host config variables");
    }
    
    var headers = new Headers();
    headers.set(''x-api-key'', config.pushy.key);
    headers.set(''Content-Type'', ''application/json'');
    
    return fetch(config.pushy.host + endpoint, {
        method: method,
        mode: ''cors'',
        headers: headers,
        body: JSON.stringify(body)
    })
    .then(function (response) {
        if (response.status < 200 || response.status > 299) {
            return response.text()
            .then(function (text) {
                throw new Error(text);
            })
        }
        return response.json()
        .then(function (json) {
            if (json) {
                if (json.errorMessage) {
                    throw new Error(json.errorMessage);
                }
           
            }
             return json;
        })
    })
}

module.exports = {
    subscribeToTopic: function(opts) {
        console.log(''trying to subscribe'')
        return getRegistration().pushManager.getSubscription()
        .then(function (sub) {
            console.log(''got sub'', sub)
            if (sub === null) {
                throw new Error("Subscription has to be created outside of Service Worker first (no idea why)")
            }
            return pushyRequest(("/topics/" + (opts.topic) + "/subscriptions"),''POST'', {
                type: ''web'',
                data: sub,
                confirmationNotification: opts.confirmationNotification
            })
        })
        .catch(function (err) {
            console.error(err);
            throw err;
        })
    },
    unsubscribeFromTopic: function(opts) {
        return getRegistration().pushManager.getSubscription()
        .then(function (sub) {
            return pushyRequest(("/topics/" + (opts.topic) + "/subscriptions"),''DELETE'', {
                type: ''web'',
                data: sub,
                confirmationNotification: opts.confirmationNotification
            })
        })
    },
    getSubscribedTopics: function() {
        return getRegistration().pushManager.getSubscription()
        .then(function (sub) {
            if (!sub) {
                return null;
            }
            return pushyRequest(''/get-subscriptions'', ''POST'', {type: ''web'', data: sub})
            
        })
    }
}
});

var pushy$1 = interopDefault(pushy);
var subscribeToTopic = pushy.subscribeToTopic;
var unsubscribeFromTopic = pushy.unsubscribeFromTopic;
var getSubscribedTopics = pushy.getSubscribedTopics;

var require$$13 = Object.freeze({
   default: pushy$1,
   subscribeToTopic: subscribeToTopic,
   unsubscribeFromTopic: unsubscribeFromTopic,
   getSubscribedTopics: getSubscribedTopics
});

var index$4 = createCommonjsModule(function (module, exports) {
"use strict";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var hasProp = ({}).hasOwnProperty;
var extend = function extend(child, parent) {
    for (var key in parent) {
        if (hasProp.call(parent, key)) {
            child[key] = parent[key];
        }
    }
    function ctor() {
        this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
};

var TimeoutError = exports.TimeoutError = function (message) {
    if (!(this instanceof TimeoutError)) {
        return new TimeoutError(message);
    }
    if (Error.captureStackTrace) {
        // This is better, because it makes the resulting stack trace have the correct error name.  But, it
        // only works in V8/Chrome.
        TimeoutError.__super__.constructor.apply(this, arguments);
        Error.captureStackTrace(this, this.constructor);
    } else {
        // Hackiness for other browsers.
        this.stack = new Error(message).stack;
    }
    this.message = message;
    this.name = "TimeoutError";
};
extend(TimeoutError, Error);

/*
 * Returns a Promise which resolves after `ms` milliseconds have elapsed.  The returned Promise will never reject.
 */
exports.delay = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};

/*
 * Returns a `{promise, resolve, reject}` object.  The returned `promise` will resolve or reject when `resolve` or
 * `reject` are called.
 */
exports.defer = function () {
    var answer = {};
    answer.promise = new Promise(function (resolve, reject) {
        answer.resolve = resolve;
        answer.reject = reject;
    });
    return answer;
};

/*
 * Given an array, `tasks`, of functions which return Promises, executes each function in `tasks` in series, only
 * calling the next function once the previous function has completed.
 */
exports.series = function (tasks) {
    var results = [];
    return tasks.reduce(function (series, task) {
        return series.then(task).then(function (result) {
            results.push(result);
        });
    }, Promise.resolve()).then(function () {
        return results;
    });
};

/*
 * Given an array, `tasks`, of functions which return Promises, executes each function in `tasks` in parallel.
 * If `limit` is supplied, then at most `limit` tasks will be executed concurrently.
 */
exports.parallel = exports.parallelLimit = function (tasks, limit) {
    if (!limit || limit < 1 || limit >= tasks.length) {
        return Promise.all(tasks.map(function (task) {
            return Promise.resolve().then(task);
        }));
    }

    return new Promise(function (resolve, reject) {
        var results = [];

        var currentTask = 0;
        var running = 0;
        var errored = false;

        var startTask = function startTask() {
            if (errored) {
                return;
            }
            if (currentTask >= tasks.length) {
                return;
            }

            var taskNumber = currentTask++;
            var task = tasks[taskNumber];
            running++;

            Promise.resolve().then(task).then(function (result) {
                results[taskNumber] = result;
                running--;
                if (currentTask < tasks.length && running < limit) {
                    startTask();
                } else if (running === 0) {
                    resolve(results);
                }
            }, function (err) {
                if (errored) {
                    return;
                }
                errored = true;
                reject(err);
            });
        };

        // Start up `limit` tasks.
        for (var i = 0; i < limit; i++) {
            startTask();
        }
    });
};

/*
 * Given an array `arr` of items, calls `iter(item, index)` for every item in `arr`.  `iter()` should return a
 * Promise.  Up to `limit` items will be called in parallel (defaults to 1.)
 */
exports.map = function (arr, iter, limit) {
    var taskLimit = limit;
    if (!limit || limit < 1) {
        taskLimit = 1;
    }
    if (limit >= arr.length) {
        taskLimit = arr.length;
    }

    var tasks = arr.map(function (item, index) {
        return function () {
            return iter(item, index);
        };
    });
    return exports.parallel(tasks, taskLimit);
};

/*
 * Add a timeout to an existing Promise.
 *
 * Resolves to the same value as `p` if `p` resolves within `ms` milliseconds, otherwise the returned Promise will
 * reject with the error "Timeout: Promise did not resolve within ${ms} milliseconds"
 */
exports.timeout = function (p, ms) {
    return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () {
            timer = null;
            reject(new exports.TimeoutError("Timeout: Promise did not resolve within " + ms + " milliseconds"));
        }, ms);

        p.then(function (result) {
            if (timer !== null) {
                clearTimeout(timer);
                resolve(result);
            }
        }, function (err) {
            if (timer !== null) {
                clearTimeout(timer);
                reject(err);
            }
        });
    });
};

/*
 * Continually call `fn()` while `test()` returns true.
 *
 * `fn()` should return a Promise.  `test()` is a synchronous function which returns true of false.
 *
 * `whilst` will resolve to the last value that `fn()` resolved to, or will reject immediately with an error if
 * `fn()` rejects or if `fn()` or `test()` throw.
 */
exports.whilst = function (test, fn) {
    return new Promise(function (resolve, reject) {
        var lastResult = null;
        var doIt = function doIt() {
            try {
                if (test()) {
                    Promise.resolve().then(fn).then(function (result) {
                        lastResult = result;
                        setTimeout(doIt, 0);
                    }, reject);
                } else {
                    resolve(lastResult);
                }
            } catch (err) {
                reject(err);
            }
        };

        doIt();
    });
};

exports.doWhilst = function (fn, test) {
    var first = true;
    var doTest = function doTest() {
        var answer = first || test();
        first = false;
        return answer;
    };
    return exports.whilst(doTest, fn);
};

/*
 * keep calling `fn` until it returns a non-error value, doesn''t throw, or returns a Promise that resolves. `fn` will be
 * attempted `times` many times before rejecting. If `times` is given as `Infinity`, then `retry` will attempt to
 * resolve forever (useful if you are just waiting for something to finish).
 * @param {Object|Number} options hash to provide `times` and `interval`. Defaults (times=5, interval=0). If this value
 *                        is a number, only `times` will be set.
 * @param {Function}      fn the task/check to be performed. Can either return a synchronous value, throw an error, or
 *                        return a promise
 * @returns {Promise}
 */
exports.retry = function (options, fn) {
    var times = 5;
    var interval = 0;
    var attempts = 0;
    var lastAttempt = null;

    function makeTimeOptionError(value) {
        return new Error("Unsupported argument type for ''times'': " + (typeof value === "undefined" ? "undefined" : _typeof(value)));
    }

    if (''function'' === typeof options) fn = options;else if (''number'' === typeof options) times = +options;else if (''object'' === (typeof options === "undefined" ? "undefined" : _typeof(options))) {
        if (''number'' === typeof options.times) times = +options.times;else if (options.times) return Promise.reject(makeTimeOptionError(options.times));

        if (options.interval) interval = +options.interval;
    } else if (options) return Promise.reject(makeTimeOptionError(options));else return Promise.reject(new Error(''No parameters given''));

    return new Promise(function (resolve, reject) {
        var doIt = function doIt() {
            Promise.resolve().then(function () {
                return fn(lastAttempt);
            }).then(resolve).catch(function (err) {
                attempts++;
                lastAttempt = err;
                if (times !== Infinity && attempts === times) {
                    reject(lastAttempt);
                } else {
                    setTimeout(doIt, interval);
                }
            });
        };
        doIt();
    });
};
});

var index$5 = interopDefault(index$4);
var retry = index$4.retry;
var doWhilst = index$4.doWhilst;
var whilst = index$4.whilst;
var timeout = index$4.timeout;
var map = index$4.map;
var parallel = index$4.parallel;
var parallelLimit = index$4.parallelLimit;
var series = index$4.series;
var defer$1 = index$4.defer;
var delay = index$4.delay;
var TimeoutError = index$4.TimeoutError;

var require$$0$7 = Object.freeze({
    default: index$5,
    retry: retry,
    doWhilst: doWhilst,
    whilst: whilst,
    timeout: timeout,
    map: map,
    parallel: parallel,
    parallelLimit: parallelLimit,
    series: series,
    defer: defer$1,
    delay: delay,
    TimeoutError: TimeoutError
});

var index$8 = createCommonjsModule(function (module) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case ''[object Date]'': return ''date'';
    case ''[object RegExp]'': return ''regexp'';
    case ''[object Arguments]'': return ''arguments'';
    case ''[object Array]'': return ''array'';
    case ''[object Error]'': return ''error'';
  }

  if (val === null) return ''null'';
  if (val === undefined) return ''undefined'';
  if (val !== val) return ''nan'';
  if (val && val.nodeType === 1) return ''element'';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};
});

var index$9 = interopDefault(index$8);


var require$$1$6 = Object.freeze({
  default: index$9
});

var index$12 = createCommonjsModule(function (module) {
''use strict'';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === ''[object Object]'' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};
});

var index$13 = interopDefault(index$12);


var require$$0$10 = Object.freeze({
	default: index$13
});

var index$10 = createCommonjsModule(function (module, exports) {
''use strict'';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;

var _isPlainObj = interopDefault(require$$0$10);

var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parse `opts` to valid IDBKeyRange.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
 *
 * @param {Object} opts
 * @return {IDBKeyRange}
 */

function range(opts) {
  var IDBKeyRange = commonjsGlobal.IDBKeyRange || commonjsGlobal.webkitIDBKeyRange;
  if (opts instanceof IDBKeyRange) return opts;
  if (typeof opts === ''undefined'' || opts === null) return null;
  if (!(0, _isPlainObj2.default)(opts)) return IDBKeyRange.only(opts);
  var keys = Object.keys(opts).sort();

  if (keys.length === 1) {
    var key = keys[0];
    var val = opts[key];

    switch (key) {
      case ''eq'':
        return IDBKeyRange.only(val);
      case ''gt'':
        return IDBKeyRange.lowerBound(val, true);
      case ''lt'':
        return IDBKeyRange.upperBound(val, true);
      case ''gte'':
        return IDBKeyRange.lowerBound(val);
      case ''lte'':
        return IDBKeyRange.upperBound(val);
      default:
        throw new TypeError(''"'' + key + ''" is not valid key'');
    }
  } else {
    var x = opts[keys[0]];
    var y = opts[keys[1]];
    var pattern = keys.join(''-'');

    switch (pattern) {
      case ''gt-lt'':
        return IDBKeyRange.bound(x, y, true, true);
      case ''gt-lte'':
        return IDBKeyRange.bound(x, y, true, false);
      case ''gte-lt'':
        return IDBKeyRange.bound(x, y, false, true);
      case ''gte-lte'':
        return IDBKeyRange.bound(x, y, false, false);
      default:
        throw new TypeError(''"'' + pattern + ''" are conflicted keys'');
    }
  }
}
module.exports = exports[''default''];
});

var index$11 = interopDefault(index$10);


var require$$0$9 = Object.freeze({
  default: index$11
});

var idbStore = createCommonjsModule(function (module) {
var type = interopDefault(require$$1$6);
var parseRange = interopDefault(require$$0$9);

/**
 * Expose `Store`.
 */

module.exports = Store;

/**
 * Initialize new `Store`.
 *
 * @param {String} name
 * @param {Object} opts
 */

function Store(name, opts) {
  this.db = null;
  this.name = name;
  this.indexes = {};
  this.opts = opts;
  this.key = opts.key || opts.keyPath || undefined;
  this.increment = opts.increment || opts.autoIncretement || undefined;
}

/**
 * Get index by `name`.
 *
 * @param {String} name
 * @return {Index}
 */

Store.prototype.index = function(name) {
  return this.indexes[name];
};

/**
 * Put (create or replace) `key` to `val`.
 *
 * @param {String|Object} [key] is optional when store.key exists.
 * @param {Any} val
 * @param {Function} cb
 */

Store.prototype.put = function(key, val, cb) {
  var name = this.name;
  var keyPath = this.key;
  if (keyPath) {
    if (type(key) == ''object'') {
      cb = val;
      val = key;
      key = null;
    } else {
      val[keyPath] = key;
    }
  }

  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = keyPath ? objectStore.put(val) : objectStore.put(val, key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb(null, req.result) };
  });
};

/**
 * Get `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.get = function(key, cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.get(key);
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Del `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.del = function(key, cb) {
  var name = this.name;
  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.delete(key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Count.
 *
 * @param {Function} cb
 */

Store.prototype.count = function(cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.count();
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Clear.
 *
 * @param {Function} cb
 */

Store.prototype.clear = function(cb) {
  var name = this.name;
  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.clear();
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Perform batch operation.
 *
 * @param {Object} vals
 * @param {Function} cb
 */

Store.prototype.batch = function(vals, cb) {
  var name = this.name;
  var keyPath = this.key;
  var keys = Object.keys(vals);

  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var store = tr.objectStore(name);
    var current = 0;
    tr.onerror = tr.onabort = cb;
    tr.oncomplete = function oncomplete() { cb() };
    next();

    function next() {
      if (current >= keys.length) return;
      var currentKey = keys[current];
      var currentVal = vals[currentKey];
      var req;

      if (currentVal === null) {
        req = store.delete(currentKey);
      } else if (keyPath) {
        if (!currentVal[keyPath]) currentVal[keyPath] = currentKey;
        req = store.put(currentVal);
      } else {
        req = store.put(currentVal, currentKey);
      }

      req.onerror = cb;
      req.onsuccess = next;
      current += 1;
    }
  });
};

/**
 * Get all.
 *
 * @param {Function} cb
 */

Store.prototype.all = function(cb) {
  var result = [];

  this.cursor({ iterator: iterator }, function(err) {
    err ? cb(err) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Create read cursor for specific `range`,
 * and pass IDBCursor to `iterator` function.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
 *
 * @param {Object} opts:
 *   {IDBRange|Object} range - passes to .openCursor()
 *   {Function} iterator - function to call with IDBCursor
 *   {String} [index] - name of index to start cursor by index
 * @param {Function} cb - calls on end or error
 */

Store.prototype.cursor = function(opts, cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var store = opts.index
      ? tr.objectStore(name).index(opts.index)
      : tr.objectStore(name);
    var req = store.openCursor(parseRange(opts.range));

    req.onerror = cb;
    req.onsuccess = function onsuccess(e) {
      var cursor = e.target.result;
      cursor ? opts.iterator(cursor) : cb();
    };
  });
};
});

var idbStore$1 = interopDefault(idbStore);


var require$$1$7 = Object.freeze({
  default: idbStore$1
});

var idbIndex = createCommonjsModule(function (module) {
var parseRange = interopDefault(require$$0$9);

/**
 * Expose `Index`.
 */

module.exports = Index;

/**
 * Initialize new `Index`.
 *
 * @param {Store} store
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} opts { unique: false, multi: false }
 */

function Index(store, name, field, opts) {
  this.store = store;
  this.name = name;
  this.field = field;
  this.opts = opts;
  this.multi = opts.multi || opts.multiEntry || false;
  this.unique = opts.unique || false;
}

/**
 * Get `key`.
 *
 * @param {Object|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.get = function(key, cb) {
  var result = [];
  var isUnique = this.unique;
  var opts = { range: key, iterator: iterator };

  this.cursor(opts, function(err) {
    if (err) return cb(err);
    isUnique ? cb(null, result[0]) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Count records by `key`.
 *
 * @param {String|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.count = function(key, cb) {
  var name = this.store.name;
  var indexName = this.name;

  this.store.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var index = tr.objectStore(name).index(indexName);
    var req = index.count(parseRange(key));
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Create cursor.
 * Proxy to `this.store` for convinience.
 *
 * @param {Object} opts
 * @param {Function} cb
 */

Index.prototype.cursor = function(opts, cb) {
  opts.index = this.name;
  this.store.cursor(opts, cb);
};
});

var idbIndex$1 = interopDefault(idbIndex);


var require$$0$11 = Object.freeze({
  default: idbIndex$1
});

var schema$1 = createCommonjsModule(function (module) {
var type = interopDefault(require$$1$6);
var Store = interopDefault(require$$1$7);
var Index = interopDefault(require$$0$11);

/**
 * Expose `Schema`.
 */

module.exports = Schema;

/**
 * Initialize new `Schema`.
 */

function Schema() {
  if (!(this instanceof Schema)) return new Schema();
  this._stores = {};
  this._current = {};
  this._versions = {};
}

/**
 * Set new version.
 *
 * @param {Number} version
 * @return {Schema}
 */

Schema.prototype.version = function(version) {
  if (type(version) != ''number'' || version < 1 || version < this.getVersion())
    throw new TypeError(''not valid version'');

  this._current = { version: version, store: null };
  this._versions[version] = {
    stores: [],      // db.createObjectStore
    dropStores: [],  // db.deleteObjectStore
    indexes: [],     // store.createIndex
    dropIndexes: [], // store.deleteIndex
    version: version // version
  };

  return this;
};

/**
 * Add store.
 *
 * @param {String} name
 * @param {Object} [opts] { key: false }
 * @return {Schema}
 */

Schema.prototype.addStore = function(name, opts) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (this._stores[name]) throw new TypeError(''store is already defined'');
  var store = new Store(name, opts || {});
  this._stores[name] = store;
  this._versions[this.getVersion()].stores.push(store);
  this._current.store = store;
  return this;
};

/**
 * Drop store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropStore = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  var store = this._stores[name];
  if (!store) throw new TypeError(''store is not defined'');
  delete this._stores[name];
  this._versions[this.getVersion()].dropStores.push(store);
  return this;
};

/**
 * Add index.
 *
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} [opts] { unique: false, multi: false }
 * @return {Schema}
 */

Schema.prototype.addIndex = function(name, field, opts) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (type(field) != ''string'' && type(field) != ''array'') throw new TypeError(''`field` is required'');
  var store = this._current.store;
  if (store.indexes[name]) throw new TypeError(''index is already defined'');
  var index = new Index(store, name, field, opts || {});
  store.indexes[name] = index;
  this._versions[this.getVersion()].indexes.push(index);
  return this;
};

/**
 * Drop index.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropIndex = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  var index = this._current.store.indexes[name];
  if (!index) throw new TypeError(''index is not defined'');
  delete this._current.store.indexes[name];
  this._versions[this.getVersion()].dropIndexes.push(index);
  return this;
};

/**
 * Change current store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.getStore = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (!this._stores[name]) throw new TypeError(''store is not defined'');
  this._current.store = this._stores[name];
  return this;
};

/**
 * Get version.
 *
 * @return {Number}
 */

Schema.prototype.getVersion = function() {
  return this._current.version;
};

/**
 * Generate onupgradeneeded callback.
 *
 * @return {Function}
 */

Schema.prototype.callback = function() {
  var versions = Object.keys(this._versions)
    .map(function(v) { return this._versions[v] }, this)
    .sort(function(a, b) { return a.version - b.version });

  return function onupgradeneeded(e) {
    var db = e.target.result;
    var tr = e.target.transaction;

    versions.forEach(function(versionSchema) {
      if (e.oldVersion >= versionSchema.version) return;

      versionSchema.stores.forEach(function(s) {
        var options = {};

        // Only pass the options that are explicitly specified to createObjectStore() otherwise IE/Edge
        // can throw an InvalidAccessError - see https://msdn.microsoft.com/en-us/library/hh772493(v=vs.85).aspx
        if (typeof s.key !== ''undefined'') options.keyPath = s.key;
        if (typeof s.increment !== ''undefined'') options.autoIncrement = s.increment;

        db.createObjectStore(s.name, options);
      });

      versionSchema.dropStores.forEach(function(s) {
        db.deleteObjectStore(s.name);
      });

      versionSchema.indexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.createIndex(i.name, i.field, {
          unique: i.unique,
          multiEntry: i.multi
        });
      });

      versionSchema.dropIndexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.deleteIndex(i.name);
      });
    });
  };
};
});

var schema$2 = interopDefault(schema$1);


var require$$2$2 = Object.freeze({
  default: schema$2
});

var index$6 = createCommonjsModule(function (module, exports) {
var type = interopDefault(require$$1$6);
var Schema = interopDefault(require$$2$2);
var Store = interopDefault(require$$1$7);
var Index = interopDefault(require$$0$11);

/**
 * Expose `Treo`.
 */

exports = module.exports = Treo;

/**
 * Initialize new `Treo` instance.
 *
 * @param {String} name
 * @param {Schema} schema
 */

function Treo(name, schema) {
  if (!(this instanceof Treo)) return new Treo(name, schema);
  if (type(name) != ''string'') throw new TypeError(''`name` required'');
  if (!(schema instanceof Schema)) throw new TypeError(''not valid schema'');

  this.name = name;
  this.status = ''close'';
  this.origin = null;
  this.stores = schema._stores;
  this.version = schema.getVersion();
  this.onupgradeneeded = schema.callback();

  // assign db property to each store
  Object.keys(this.stores).forEach(function(storeName) {
    this.stores[storeName].db = this;
  }, this);
}

/**
 * Expose core classes.
 */

exports.schema = Schema;
exports.cmp = cmp;
exports.Treo = Treo;
exports.Schema = Schema;
exports.Store = Store;
exports.Index = Index;

/**
 * Use plugin `fn`.
 *
 * @param {Function} fn
 * @return {Treo}
 */

Treo.prototype.use = function(fn) {
  fn(this, exports);
  return this;
};

/**
 * Drop.
 *
 * @param {Function} cb
 */

Treo.prototype.drop = function(cb) {
  var name = this.name;
  this.close(function(err) {
    if (err) return cb(err);
    var req = indexedDB().deleteDatabase(name);
    req.onerror = cb;
    req.onsuccess = function onsuccess() { cb() };
  });
};

/**
 * Close.
 *
 * @param {Function} cb
 */

Treo.prototype.close = function(cb) {
  if (this.status == ''close'') return cb();
  this.getInstance(function(err, db) {
    if (err) return cb(err);
    db.origin = null;
    db.status = ''close'';
    db.close();
    cb();
  });
};

/**
 * Get store by `name`.
 *
 * @param {String} name
 * @return {Store}
 */

Treo.prototype.store = function(name) {
  return this.stores[name];
};

/**
 * Get db instance. It starts opening transaction only once,
 * another requests will be scheduled to queue.
 *
 * @param {Function} cb
 */

Treo.prototype.getInstance = function(cb) {
  if (this.status == ''open'') return cb(null, this.origin);
  if (this.status == ''opening'') return this.queue.push(cb);

  this.status = ''opening'';
  this.queue = [cb]; // queue callbacks

  var that = this;
  var req = indexedDB().open(this.name, this.version);
  req.onupgradeneeded = this.onupgradeneeded;

  req.onerror = req.onblocked = function onerror(e) {
    that.status = ''error'';
    that.queue.forEach(function(cb) { cb(e) });
    delete that.queue;
  };

  req.onsuccess = function onsuccess(e) {
    that.origin = e.target.result;
    that.status = ''open'';
    that.origin.onversionchange = function onversionchange() {
      that.close(function() {});
    };
    that.queue.forEach(function(cb) { cb(null, that.origin) });
    delete that.queue;
  };
};

/**
 * Create new transaction for selected `stores`.
 *
 * @param {String} type (readwrite|readonly)
 * @param {Array} stores - follow indexeddb semantic
 * @param {Function} cb
 */

Treo.prototype.transaction = function(type, stores, cb) {
  this.getInstance(function(err, db) {
    err ? cb(err) : cb(null, db.transaction(stores, type));
  });
};

/**
 * Compare 2 values using IndexedDB comparision algotihm.
 *
 * @param {Mixed} value1
 * @param {Mixed} value2
 * @return {Number} -1|0|1
 */

function cmp() {
  return indexedDB().cmp.apply(indexedDB(), arguments);
}

/**
 * Dynamic link to `global.indexedDB` for polyfills support.
 *
 * @return {IDBDatabase}
 */

function indexedDB() {
  return commonjsGlobal._indexedDB
    || commonjsGlobal.indexedDB
    || commonjsGlobal.msIndexedDB
    || commonjsGlobal.mozIndexedDB
    || commonjsGlobal.webkitIndexedDB;
}
});

var index$7 = interopDefault(index$6);
var Index = index$6.Index;
var Store = index$6.Store;
var Schema = index$6.Schema;
var Treo = index$6.Treo;
var cmp = index$6.cmp;
var schema = index$6.schema;

var require$$1$5 = Object.freeze({
  default: index$7,
  Index: Index,
  Store: Store,
  Schema: Schema,
  Treo: Treo,
  cmp: cmp,
  schema: schema
});

var browserRaw = createCommonjsModule(function (module) {
"use strict";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser''s own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don''t
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.
var BrowserMutationObserver = commonjsGlobal.MutationObserver || commonjsGlobal.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser''s renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page''s first load. Thankfully, this version of Safari supports
// MutationObservers, so we don''t need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we''re flushing, there''s no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js
});

var browserRaw$1 = interopDefault(browserRaw);


var require$$0$16 = Object.freeze({
    default: browserRaw$1
});

var core = createCommonjsModule(function (module) {
''use strict'';

var asap = interopDefault(require$$0$16);

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don''t use symbols or Object.defineProperty to fully hide them
// because the performance isn''t good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== ''object'') {
    throw new TypeError(''Promises must be constructed via new'');
  }
  if (typeof fn !== ''function'') {
    throw new TypeError(''not a function'');
  }
  this._45 = 0;
  this._81 = 0;
  this._65 = null;
  this._54 = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._10 = null;
Promise._97 = null;
Promise._61 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
};
function handle(self, deferred) {
  while (self._81 === 3) {
    self = self._65;
  }
  if (Promise._10) {
    Promise._10(self);
  }
  if (self._81 === 0) {
    if (self._45 === 0) {
      self._45 = 1;
      self._54 = deferred;
      return;
    }
    if (self._45 === 1) {
      self._45 = 2;
      self._54 = [self._54, deferred];
      return;
    }
    self._54.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  asap(function() {
    var cb = self._81 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._81 === 1) {
        resolve(deferred.promise, self._65);
      } else {
        reject(deferred.promise, self._65);
      }
      return;
    }
    var ret = tryCallOne(cb, self._65);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError(''A promise cannot be resolved with itself.'')
    );
  }
  if (
    newValue &&
    (typeof newValue === ''object'' || typeof newValue === ''function'')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._81 = 3;
      self._65 = newValue;
      finale(self);
      return;
    } else if (typeof then === ''function'') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._81 = 1;
  self._65 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._81 = 2;
  self._65 = newValue;
  if (Promise._97) {
    Promise._97(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._45 === 1) {
    handle(self, self._54);
    self._54 = null;
  }
  if (self._45 === 2) {
    for (var i = 0; i < self._54.length; i++) {
      handle(self, self._54[i]);
    }
    self._54 = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === ''function'' ? onFulfilled : null;
  this.onRejected = typeof onRejected === ''function'' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  })
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}
});

var core$1 = interopDefault(core);


var require$$0$15 = Object.freeze({
  default: core$1
});

var done = createCommonjsModule(function (module) {
''use strict'';

var Promise = interopDefault(require$$0$15);

module.exports = Promise;
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this;
  self.then(null, function (err) {
    setTimeout(function () {
      throw err;
    }, 0);
  });
};
});

interopDefault(done);

var _finally = createCommonjsModule(function (module) {
''use strict'';

var Promise = interopDefault(require$$0$15);

module.exports = Promise;
Promise.prototype[''finally''] = function (f) {
  return this.then(function (value) {
    return Promise.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return Promise.resolve(f()).then(function () {
      throw err;
    });
  });
};
});

interopDefault(_finally);

var es6Extensions = createCommonjsModule(function (module) {
''use strict'';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = interopDefault(require$$0$15);

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('''');

function valuePromise(value) {
  var p = new Promise(Promise._61);
  p._81 = 1;
  p._65 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '''') return EMPTYSTRING;

  if (typeof value === ''object'' || typeof value === ''function'') {
    try {
      var then = value.then;
      if (typeof then === ''function'') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === ''object'' || typeof val === ''function'')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._81 === 3) {
            val = val._65;
          }
          if (val._81 === 1) return res(i, val._65);
          if (val._81 === 2) reject(val._65);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === ''function'') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype[''catch''] = function (onRejected) {
  return this.then(null, onRejected);
};
});

interopDefault(es6Extensions);

var browserAsap = createCommonjsModule(function (module) {
"use strict";

// rawAsap provides everything we need except exception management.
var rawAsap = interopDefault(require$$0$16);
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};
});

var browserAsap$1 = interopDefault(browserAsap);


var require$$0$17 = Object.freeze({
    default: browserAsap$1
});

var nodeExtensions = createCommonjsModule(function (module) {
''use strict'';

// This file contains then/promise specific extensions that are only useful
// for node.js interop

var Promise = interopDefault(require$$0$15);
var asap = interopDefault(require$$0$17);

module.exports = Promise;

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  if (
    typeof argumentCount === ''number'' && argumentCount !== Infinity
  ) {
    return denodeifyWithCount(fn, argumentCount);
  } else {
    return denodeifyWithoutCount(fn);
  }
}

var callbackFn = (
  ''function (err, res) {'' +
  ''if (err) { rj(err); } else { rs(res); }'' +
  ''}''
);
function denodeifyWithCount(fn, argumentCount) {
  var args = [];
  for (var i = 0; i < argumentCount; i++) {
    args.push(''a'' + i);
  }
  var body = [
    ''return function ('' + args.join('','') + '') {'',
    ''var self = this;'',
    ''return new Promise(function (rs, rj) {'',
    ''var res = fn.call('',
    [''self''].concat(args).concat([callbackFn]).join('',''),
    '');'',
    ''if (res &&'',
    ''(typeof res === "object" || typeof res === "function") &&'',
    ''typeof res.then === "function"'',
    '') {rs(res);}'',
    ''});'',
    ''};''
  ].join('''');
  return Function([''Promise'', ''fn''], body)(Promise, fn);
}
function denodeifyWithoutCount(fn) {
  var fnLength = Math.max(fn.length - 1, 3);
  var args = [];
  for (var i = 0; i < fnLength; i++) {
    args.push(''a'' + i);
  }
  var body = [
    ''return function ('' + args.join('','') + '') {'',
    ''var self = this;'',
    ''var args;'',
    ''var argLength = arguments.length;'',
    ''if (arguments.length > '' + fnLength + '') {'',
    ''args = new Array(arguments.length + 1);'',
    ''for (var i = 0; i < arguments.length; i++) {'',
    ''args[i] = arguments[i];'',
    ''}'',
    ''}'',
    ''return new Promise(function (rs, rj) {'',
    ''var cb = '' + callbackFn + '';'',
    ''var res;'',
    ''switch (argLength) {'',
    args.concat([''extra'']).map(function (_, index) {
      return (
        ''case '' + (index) + '':'' +
        ''res = fn.call('' + [''self''].concat(args.slice(0, index)).concat(''cb'').join('','') + '');'' +
        ''break;''
      );
    }).join(''''),
    ''default:'',
    ''args[argLength] = cb;'',
    ''res = fn.apply(self, args);'',
    ''}'',
    
    ''if (res &&'',
    ''(typeof res === "object" || typeof res === "function") &&'',
    ''typeof res.then === "function"'',
    '') {rs(res);}'',
    ''});'',
    ''};''
  ].join('''');

  return Function(
    [''Promise'', ''fn''],
    body
  )(Promise, fn);
}

Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback =
      typeof args[args.length - 1] === ''function'' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == ''undefined'') {
        return new Promise(function (resolve, reject) {
          reject(ex);
        });
      } else {
        asap(function () {
          callback.call(ctx, ex);
        })
      }
    }
  }
}

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != ''function'') return this;

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value);
    });
  }, function (err) {
    asap(function () {
      callback.call(ctx, err);
    });
  });
}
});

interopDefault(nodeExtensions);

var synchronous = createCommonjsModule(function (module) {
''use strict'';

var Promise = interopDefault(require$$0$15);

module.exports = Promise;
Promise.enableSynchronous = function () {
  Promise.prototype.isPending = function() {
    return this.getState() == 0;
  };

  Promise.prototype.isFulfilled = function() {
    return this.getState() == 1;
  };

  Promise.prototype.isRejected = function() {
    return this.getState() == 2;
  };

  Promise.prototype.getValue = function () {
    if (this._81 === 3) {
      return this._65.getValue();
    }

    if (!this.isFulfilled()) {
      throw new Error(''Cannot get a value of an unfulfilled promise.'');
    }

    return this._65;
  };

  Promise.prototype.getReason = function () {
    if (this._81 === 3) {
      return this._65.getReason();
    }

    if (!this.isRejected()) {
      throw new Error(''Cannot get a rejection reason of a non-rejected promise.'');
    }

    return this._65;
  };

  Promise.prototype.getState = function () {
    if (this._81 === 3) {
      return this._65.getState();
    }
    if (this._81 === -1 || this._81 === -2) {
      return 0;
    }

    return this._81;
  };
};

Promise.disableSynchronous = function() {
  Promise.prototype.isPending = undefined;
  Promise.prototype.isFulfilled = undefined;
  Promise.prototype.isRejected = undefined;
  Promise.prototype.getValue = undefined;
  Promise.prototype.getReason = undefined;
  Promise.prototype.getState = undefined;
};
});

interopDefault(synchronous);

var index$18 = createCommonjsModule(function (module) {
''use strict'';

module.exports = interopDefault(require$$0$15);
});

var index$19 = interopDefault(index$18);


var require$$0$14 = Object.freeze({
	default: index$19
});

var index$16 = createCommonjsModule(function (module) {
''use strict'';

module.exports = interopDefault(require$$0$14)
});

var index$17 = interopDefault(index$16);


var require$$0$13 = Object.freeze({
	default: index$17
});

var index$14 = createCommonjsModule(function (module) {
var denodeify = interopDefault(require$$0$13).denodeify;

/**
 * Expose `plugin()`.
 */

module.exports = plugin;

/**
 * Methods for patch.
 */

var dbMethods = [
  ''drop'',
  ''close''
];

var storeMethods = [
  ''put'',
  ''get'', 
  ''del'',
  ''count'',
  ''clear'',
  ''batch'',
  ''all''
];

var indexMethods = [
  ''get'',
  ''count''
];

/**
 * Denodeify each db''s method and add promises support with
 * https://github.com/jakearchibald/es6-promise
 */

function plugin() {
  return function(db) {
    patch(db, dbMethods);

    Object.keys(db.stores).forEach(function(storeName) {
      var store = db.store(storeName);
      patch(store, storeMethods);

      Object.keys(store.indexes).forEach(function(indexName) {
        var index = store.index(indexName);
        patch(index, indexMethods);
      });
    });
  };
}

/**
 * Patch `methods` from `object` with `denodeify`.
 *
 * @param {Object} object
 * @param {Array} methods
 */

function patch(object, methods) {
  methods.forEach(function(m) {
    object[m] = denodeify(object[m]);
  });
}
});

var index$15 = interopDefault(index$14);


var require$$0$12 = Object.freeze({
  default: index$15
});

var db = createCommonjsModule(function (module) {
var treo = interopDefault(require$$1$5);
var treoPromise = interopDefault(require$$0$12);

var schema = treo.schema()
    .version(1)
        .addStore("notificationChains", {key: "id", increment: true})
        .addIndex("byChain", "chain")
    .version(2)
        .addStore("quizAnswers", {key: ["questionId", "quizId"]})
        .addIndex("byQuiz", "quizId");
        
var db = treo(''notification-commands'', schema)
    .use(treoPromise());

module.exports = db;
});

var db$1 = interopDefault(db);


var require$$0$8 = Object.freeze({
    default: db$1
});

var runCommand$1 = createCommonjsModule(function (module) {
var runCommand = function(name, opts, event, context) {
    var nameSplit = name.split(''.'');
    var currentTarget = runCommand.commands;
    
    nameSplit.forEach(function (name) {
        currentTarget = currentTarget[name];
        if (!currentTarget) {
            throw new Error("Could not find target: " + name)
        }
    });
    return currentTarget(opts, event, context);
}

module.exports = runCommand;

self._runCommand = runCommand;
});

var runCommand$2 = interopDefault(runCommand$1);


var require$$1$8 = Object.freeze({
    default: runCommand$2
});

var chains = createCommonjsModule(function (module) {
var PromiseTools = interopDefault(require$$0$7);
var db = interopDefault(require$$0$8);
var run = interopDefault(require$$1$8);

var notificationStore = db.store("notificationChains");

var getNextNotificationForChain = function(chain, skipID) {
    return notificationStore
        .index("byChain")
        .get(chain)
        .then(function (chainItems) {
            return chainItems
                .filter(function (i) { return i.read !== true && (!skipID || i.id !== skipID); })
                .sort(function (a,b) { return a.idx - b.idx; })
                [0]
        })
}

var chains = {
    download: function(opts) {
        return fetch(opts.url)
            .then(function (res) { return res.json(); })
            .then(function (json) {
                return PromiseTools.map(json, function (chain) {
                    return chains.store(chain)
                })
            })
    },
    delete: function(chain) {
        return notificationStore
            .index("byChain")
            .get(chain)
            .then(function (chainItems) {
                return PromiseTools.map(chainItems, function (item) { return notificationStore.del(item.id); });
            })
    },
    store: function(ref) {
        var chain = ref.chain;
        var values = ref.values;

        return chains.delete(chain)
            .then(function () {

                values.forEach(function (obj, idx) {
                    // Add chain and index properties to our entry,
                    // for future search and sort
                    obj.chain = chain;
                    obj.index = idx;
                })
                return PromiseTools.map(values, function (value) {
                    return notificationStore.put(value);
                })
            })
    },
    notificationAtIndex: function(opts, event, context) {
        return notificationStore
            .index("byChain")
            .get(opts.chain)
        .then(function (chainItems) {
            if (chainItems.length === 0) {
                return console.error("No chain with the name: ", opts.chain)
            }
            var chainEntry = chainItems[opts.index];
            if (!chainEntry) {
                return console.error("No notification at index #", opts.index);
            }
            return run("notification.show", {
                title: chainEntry.title,
                options: chainEntry.notificationTemplate,
                actionCommands: chainEntry.actions
            }, null, context);
        })
    },
    notificationFromChain: function(opts, event, context) {
        
        return getNextNotificationForChain(opts.chain)
            .then(function (chainEntry) {

                // chain notifications need to follow a specific format

                var sameChainCommand = chainEntry.actions.find(function (c) { return c.label === "sameChain"; });
                var switchChainCommand = chainEntry.actions.find(function (c) { return c.label === "switchChain"; });
                var linkCommands = chainEntry.actions.filter(function (c) { return c.label === "web-link"; });

                // now we have our commands we need to check whether either of those
                // chains still have entries in them.

                return PromiseTools.parallel([
                    function() {

                        // sometimes we don''t actually have a same chain command - e.g. if we
                        // know it is the end of the chain.

                        if (!sameChainCommand) return null;

                        return getNextNotificationForChain(opts.chain, chainEntry.id)
                    },
                    function() {
                        if (!switchChainCommand) return null;

                        return getNextNotificationForChain(switchChainCommand.switchTo)
                    }
                ])
                .then(function (ref) {
                    var sameChainNext = ref[0];
                    var switchedChainNext = ref[1];

                    var actions = [];

                    // now we know which commands we can actually use. If they have
                    // at least one item in the array, we''ll use them.

                    if (sameChainNext) {
                        actions.push(sameChainCommand);
                    }
                    if (switchedChainNext) {
                        if (chainEntry.actions.indexOf(sameChainCommand) > chainEntry.actions.indexOf(switchChainCommand)) {
                            actions.unshift(switchChainCommand);
                        } else {
                            actions.push(switchChainCommand);
                        }

                    }

                    if (actions.length === 0) {
                        // If neither have any items left, we show the article link.
                        if (linkCommands[0]) {
                            actions.push(linkCommands[0]);
                        }

                        if (linkCommands[1]) {
                            actions.push(linkCommands[1]);
                        }
                    }



                    chainEntry.read = true;

                    return notificationStore.put(chainEntry)
                        .then(function () {
                            return run("notification.show", {
                                title: chainEntry.title,
                                options: chainEntry.notificationTemplate,
                                actionCommands: actions
                            }, null, context);
                        })

                })




            })

    }
}

module.exports = chains;
});

var chains$1 = interopDefault(chains);


var require$$12 = Object.freeze({
    default: chains$1
});

var index$24 = createCommonjsModule(function (module) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case ''[object Date]'': return ''date'';
    case ''[object RegExp]'': return ''regexp'';
    case ''[object Arguments]'': return ''arguments'';
    case ''[object Array]'': return ''array'';
    case ''[object Error]'': return ''error'';
  }

  if (val === null) return ''null'';
  if (val === undefined) return ''undefined'';
  if (val !== val) return ''nan'';
  if (val && val.nodeType === 1) return ''element'';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};
});

var index$25 = interopDefault(index$24);


var require$$1$12 = Object.freeze({
  default: index$25
});

var index$28 = createCommonjsModule(function (module) {
''use strict'';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === ''[object Object]'' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};
});

var index$29 = interopDefault(index$28);


var require$$0$21 = Object.freeze({
	default: index$29
});

var index$26 = createCommonjsModule(function (module, exports) {
''use strict'';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;

var _isPlainObj = interopDefault(require$$0$21);

var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parse `opts` to valid IDBKeyRange.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
 *
 * @param {Object} opts
 * @return {IDBKeyRange}
 */

function range(opts) {
  var IDBKeyRange = commonjsGlobal.IDBKeyRange || commonjsGlobal.webkitIDBKeyRange;
  if (opts instanceof IDBKeyRange) return opts;
  if (typeof opts === ''undefined'' || opts === null) return null;
  if (!(0, _isPlainObj2.default)(opts)) return IDBKeyRange.only(opts);
  var keys = Object.keys(opts).sort();

  if (keys.length === 1) {
    var key = keys[0];
    var val = opts[key];

    switch (key) {
      case ''eq'':
        return IDBKeyRange.only(val);
      case ''gt'':
        return IDBKeyRange.lowerBound(val, true);
      case ''lt'':
        return IDBKeyRange.upperBound(val, true);
      case ''gte'':
        return IDBKeyRange.lowerBound(val);
      case ''lte'':
        return IDBKeyRange.upperBound(val);
      default:
        throw new TypeError(''"'' + key + ''" is not valid key'');
    }
  } else {
    var x = opts[keys[0]];
    var y = opts[keys[1]];
    var pattern = keys.join(''-'');

    switch (pattern) {
      case ''gt-lt'':
        return IDBKeyRange.bound(x, y, true, true);
      case ''gt-lte'':
        return IDBKeyRange.bound(x, y, true, false);
      case ''gte-lt'':
        return IDBKeyRange.bound(x, y, false, true);
      case ''gte-lte'':
        return IDBKeyRange.bound(x, y, false, false);
      default:
        throw new TypeError(''"'' + pattern + ''" are conflicted keys'');
    }
  }
}
module.exports = exports[''default''];
});

var index$27 = interopDefault(index$26);


var require$$0$20 = Object.freeze({
  default: index$27
});

var idbStore$2 = createCommonjsModule(function (module) {
var type = interopDefault(require$$1$12);
var parseRange = interopDefault(require$$0$20);

/**
 * Expose `Store`.
 */

module.exports = Store;

/**
 * Initialize new `Store`.
 *
 * @param {String} name
 * @param {Object} opts
 */

function Store(name, opts) {
  this.db = null;
  this.name = name;
  this.indexes = {};
  this.opts = opts;
  this.key = opts.key || opts.keyPath || undefined;
  this.increment = opts.increment || opts.autoIncretement || undefined;
}

/**
 * Get index by `name`.
 *
 * @param {String} name
 * @return {Index}
 */

Store.prototype.index = function(name) {
  return this.indexes[name];
};

/**
 * Put (create or replace) `key` to `val`.
 *
 * @param {String|Object} [key] is optional when store.key exists.
 * @param {Any} val
 * @param {Function} cb
 */

Store.prototype.put = function(key, val, cb) {
  var name = this.name;
  var keyPath = this.key;
  if (keyPath) {
    if (type(key) == ''object'') {
      cb = val;
      val = key;
      key = null;
    } else {
      val[keyPath] = key;
    }
  }

  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = keyPath ? objectStore.put(val) : objectStore.put(val, key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb(null, req.result) };
  });
};

/**
 * Get `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.get = function(key, cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.get(key);
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Del `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.del = function(key, cb) {
  var name = this.name;
  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.delete(key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Count.
 *
 * @param {Function} cb
 */

Store.prototype.count = function(cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.count();
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Clear.
 *
 * @param {Function} cb
 */

Store.prototype.clear = function(cb) {
  var name = this.name;
  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.clear();
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Perform batch operation.
 *
 * @param {Object} vals
 * @param {Function} cb
 */

Store.prototype.batch = function(vals, cb) {
  var name = this.name;
  var keyPath = this.key;
  var keys = Object.keys(vals);

  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var store = tr.objectStore(name);
    var current = 0;
    tr.onerror = tr.onabort = cb;
    tr.oncomplete = function oncomplete() { cb() };
    next();

    function next() {
      if (current >= keys.length) return;
      var currentKey = keys[current];
      var currentVal = vals[currentKey];
      var req;

      if (currentVal === null) {
        req = store.delete(currentKey);
      } else if (keyPath) {
        if (!currentVal[keyPath]) currentVal[keyPath] = currentKey;
        req = store.put(currentVal);
      } else {
        req = store.put(currentVal, currentKey);
      }

      req.onerror = cb;
      req.onsuccess = next;
      current += 1;
    }
  });
};

/**
 * Get all.
 *
 * @param {Function} cb
 */

Store.prototype.all = function(cb) {
  var result = [];

  this.cursor({ iterator: iterator }, function(err) {
    err ? cb(err) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Create read cursor for specific `range`,
 * and pass IDBCursor to `iterator` function.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
 *
 * @param {Object} opts:
 *   {IDBRange|Object} range - passes to .openCursor()
 *   {Function} iterator - function to call with IDBCursor
 *   {String} [index] - name of index to start cursor by index
 * @param {Function} cb - calls on end or error
 */

Store.prototype.cursor = function(opts, cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var store = opts.index
      ? tr.objectStore(name).index(opts.index)
      : tr.objectStore(name);
    var req = store.openCursor(parseRange(opts.range));

    req.onerror = cb;
    req.onsuccess = function onsuccess(e) {
      var cursor = e.target.result;
      cursor ? opts.iterator(cursor) : cb();
    };
  });
};
});

var idbStore$3 = interopDefault(idbStore$2);


var require$$1$13 = Object.freeze({
  default: idbStore$3
});

var idbIndex$2 = createCommonjsModule(function (module) {
var parseRange = interopDefault(require$$0$20);

/**
 * Expose `Index`.
 */

module.exports = Index;

/**
 * Initialize new `Index`.
 *
 * @param {Store} store
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} opts { unique: false, multi: false }
 */

function Index(store, name, field, opts) {
  this.store = store;
  this.name = name;
  this.field = field;
  this.opts = opts;
  this.multi = opts.multi || opts.multiEntry || false;
  this.unique = opts.unique || false;
}

/**
 * Get `key`.
 *
 * @param {Object|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.get = function(key, cb) {
  var result = [];
  var isUnique = this.unique;
  var opts = { range: key, iterator: iterator };

  this.cursor(opts, function(err) {
    if (err) return cb(err);
    isUnique ? cb(null, result[0]) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Count records by `key`.
 *
 * @param {String|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.count = function(key, cb) {
  var name = this.store.name;
  var indexName = this.name;

  this.store.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var index = tr.objectStore(name).index(indexName);
    var req = index.count(parseRange(key));
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Create cursor.
 * Proxy to `this.store` for convinience.
 *
 * @param {Object} opts
 * @param {Function} cb
 */

Index.prototype.cursor = function(opts, cb) {
  opts.index = this.name;
  this.store.cursor(opts, cb);
};
});

var idbIndex$3 = interopDefault(idbIndex$2);


var require$$0$22 = Object.freeze({
  default: idbIndex$3
});

var schema$4 = createCommonjsModule(function (module) {
var type = interopDefault(require$$1$12);
var Store = interopDefault(require$$1$13);
var Index = interopDefault(require$$0$22);

/**
 * Expose `Schema`.
 */

module.exports = Schema;

/**
 * Initialize new `Schema`.
 */

function Schema() {
  if (!(this instanceof Schema)) return new Schema();
  this._stores = {};
  this._current = {};
  this._versions = {};
}

/**
 * Set new version.
 *
 * @param {Number} version
 * @return {Schema}
 */

Schema.prototype.version = function(version) {
  if (type(version) != ''number'' || version < 1 || version < this.getVersion())
    throw new TypeError(''not valid version'');

  this._current = { version: version, store: null };
  this._versions[version] = {
    stores: [],      // db.createObjectStore
    dropStores: [],  // db.deleteObjectStore
    indexes: [],     // store.createIndex
    dropIndexes: [], // store.deleteIndex
    version: version // version
  };

  return this;
};

/**
 * Add store.
 *
 * @param {String} name
 * @param {Object} [opts] { key: false }
 * @return {Schema}
 */

Schema.prototype.addStore = function(name, opts) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (this._stores[name]) throw new TypeError(''store is already defined'');
  var store = new Store(name, opts || {});
  this._stores[name] = store;
  this._versions[this.getVersion()].stores.push(store);
  this._current.store = store;
  return this;
};

/**
 * Drop store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropStore = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  var store = this._stores[name];
  if (!store) throw new TypeError(''store is not defined'');
  delete this._stores[name];
  this._versions[this.getVersion()].dropStores.push(store);
  return this;
};

/**
 * Add index.
 *
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} [opts] { unique: false, multi: false }
 * @return {Schema}
 */

Schema.prototype.addIndex = function(name, field, opts) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (type(field) != ''string'' && type(field) != ''array'') throw new TypeError(''`field` is required'');
  var store = this._current.store;
  if (store.indexes[name]) throw new TypeError(''index is already defined'');
  var index = new Index(store, name, field, opts || {});
  store.indexes[name] = index;
  this._versions[this.getVersion()].indexes.push(index);
  return this;
};

/**
 * Drop index.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropIndex = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  var index = this._current.store.indexes[name];
  if (!index) throw new TypeError(''index is not defined'');
  delete this._current.store.indexes[name];
  this._versions[this.getVersion()].dropIndexes.push(index);
  return this;
};

/**
 * Change current store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.getStore = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (!this._stores[name]) throw new TypeError(''store is not defined'');
  this._current.store = this._stores[name];
  return this;
};

/**
 * Get version.
 *
 * @return {Number}
 */

Schema.prototype.getVersion = function() {
  return this._current.version;
};

/**
 * Generate onupgradeneeded callback.
 *
 * @return {Function}
 */

Schema.prototype.callback = function() {
  var versions = Object.keys(this._versions)
    .map(function(v) { return this._versions[v] }, this)
    .sort(function(a, b) { return a.version - b.version });

  return function onupgradeneeded(e) {
    var db = e.target.result;
    var tr = e.target.transaction;

    versions.forEach(function(versionSchema) {
      if (e.oldVersion >= versionSchema.version) return;

      versionSchema.stores.forEach(function(s) {
        var options = {};

        // Only pass the options that are explicitly specified to createObjectStore() otherwise IE/Edge
        // can throw an InvalidAccessError - see https://msdn.microsoft.com/en-us/library/hh772493(v=vs.85).aspx
        if (typeof s.key !== ''undefined'') options.keyPath = s.key;
        if (typeof s.increment !== ''undefined'') options.autoIncrement = s.increment;

        db.createObjectStore(s.name, options);
      });

      versionSchema.dropStores.forEach(function(s) {
        db.deleteObjectStore(s.name);
      });

      versionSchema.indexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.createIndex(i.name, i.field, {
          unique: i.unique,
          multiEntry: i.multi
        });
      });

      versionSchema.dropIndexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.deleteIndex(i.name);
      });
    });
  };
};
});

var schema$5 = interopDefault(schema$4);


var require$$2$3 = Object.freeze({
  default: schema$5
});

var index$22 = createCommonjsModule(function (module, exports) {
var type = interopDefault(require$$1$12);
var Schema = interopDefault(require$$2$3);
var Store = interopDefault(require$$1$13);
var Index = interopDefault(require$$0$22);

/**
 * Expose `Treo`.
 */

exports = module.exports = Treo;

/**
 * Initialize new `Treo` instance.
 *
 * @param {String} name
 * @param {Schema} schema
 */

function Treo(name, schema) {
  if (!(this instanceof Treo)) return new Treo(name, schema);
  if (type(name) != ''string'') throw new TypeError(''`name` required'');
  if (!(schema instanceof Schema)) throw new TypeError(''not valid schema'');

  this.name = name;
  this.status = ''close'';
  this.origin = null;
  this.stores = schema._stores;
  this.version = schema.getVersion();
  this.onupgradeneeded = schema.callback();

  // assign db property to each store
  Object.keys(this.stores).forEach(function(storeName) {
    this.stores[storeName].db = this;
  }, this);
}

/**
 * Expose core classes.
 */

exports.schema = Schema;
exports.cmp = cmp;
exports.Treo = Treo;
exports.Schema = Schema;
exports.Store = Store;
exports.Index = Index;

/**
 * Use plugin `fn`.
 *
 * @param {Function} fn
 * @return {Treo}
 */

Treo.prototype.use = function(fn) {
  fn(this, exports);
  return this;
};

/**
 * Drop.
 *
 * @param {Function} cb
 */

Treo.prototype.drop = function(cb) {
  var name = this.name;
  this.close(function(err) {
    if (err) return cb(err);
    var req = indexedDB().deleteDatabase(name);
    req.onerror = cb;
    req.onsuccess = function onsuccess() { cb() };
  });
};

/**
 * Close.
 *
 * @param {Function} cb
 */

Treo.prototype.close = function(cb) {
  if (this.status == ''close'') return cb();
  this.getInstance(function(err, db) {
    if (err) return cb(err);
    db.origin = null;
    db.status = ''close'';
    db.close();
    cb();
  });
};

/**
 * Get store by `name`.
 *
 * @param {String} name
 * @return {Store}
 */

Treo.prototype.store = function(name) {
  return this.stores[name];
};

/**
 * Get db instance. It starts opening transaction only once,
 * another requests will be scheduled to queue.
 *
 * @param {Function} cb
 */

Treo.prototype.getInstance = function(cb) {
  if (this.status == ''open'') return cb(null, this.origin);
  if (this.status == ''opening'') return this.queue.push(cb);

  this.status = ''opening'';
  this.queue = [cb]; // queue callbacks

  var that = this;
  var req = indexedDB().open(this.name, this.version);
  req.onupgradeneeded = this.onupgradeneeded;

  req.onerror = req.onblocked = function onerror(e) {
    that.status = ''error'';
    that.queue.forEach(function(cb) { cb(e) });
    delete that.queue;
  };

  req.onsuccess = function onsuccess(e) {
    that.origin = e.target.result;
    that.status = ''open'';
    that.origin.onversionchange = function onversionchange() {
      that.close(function() {});
    };
    that.queue.forEach(function(cb) { cb(null, that.origin) });
    delete that.queue;
  };
};

/**
 * Create new transaction for selected `stores`.
 *
 * @param {String} type (readwrite|readonly)
 * @param {Array} stores - follow indexeddb semantic
 * @param {Function} cb
 */

Treo.prototype.transaction = function(type, stores, cb) {
  this.getInstance(function(err, db) {
    err ? cb(err) : cb(null, db.transaction(stores, type));
  });
};

/**
 * Compare 2 values using IndexedDB comparision algotihm.
 *
 * @param {Mixed} value1
 * @param {Mixed} value2
 * @return {Number} -1|0|1
 */

function cmp() {
  return indexedDB().cmp.apply(indexedDB(), arguments);
}

/**
 * Dynamic link to `global.indexedDB` for polyfills support.
 *
 * @return {IDBDatabase}
 */

function indexedDB() {
  return commonjsGlobal._indexedDB
    || commonjsGlobal.indexedDB
    || commonjsGlobal.msIndexedDB
    || commonjsGlobal.mozIndexedDB
    || commonjsGlobal.webkitIndexedDB;
}
});

var index$23 = interopDefault(index$22);
var Index$1 = index$22.Index;
var Store$1 = index$22.Store;
var Schema$1 = index$22.Schema;
var Treo$1 = index$22.Treo;
var cmp$1 = index$22.cmp;
var schema$3 = index$22.schema;

var require$$0$19 = Object.freeze({
  default: index$23,
  Index: Index$1,
  Store: Store$1,
  Schema: Schema$1,
  Treo: Treo$1,
  cmp: cmp$1,
  schema: schema$3
});

var db$2 = createCommonjsModule(function (module) {
var Treo = interopDefault(require$$0$19);

var toPromisify = [''get'', ''put'', ''all'', ''count'', ''del''];

toPromisify.forEach(function (method) {
    var origFunc = Treo.Store.prototype[method];
    
    Treo.Store.prototype[method] = function() {
        var arguments$1 = arguments;
        var this$1 = this;


        return new Promise(function (fulfill, reject) {
            
            var args = Array.from(arguments$1);
            args.push(function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    fulfill(data);
                }
            })
            origFunc.apply(this$1, args)
        })
    }
})

var schema = Treo.schema()
    .version(1)
        .addStore("analyticsPings", { key: "id", increment: true })
        .addStore("clientGuid", {key: "name"});

        
var db = Treo("google-analytics-protocol", schema)

module.exports = db;
});

var db$3 = interopDefault(db$2);


var require$$1$11 = Object.freeze({
    default: db$3
});

var config$3 = createCommonjsModule(function (module) {
module.exports = {};
});

var config$4 = interopDefault(config$3);


var require$$1$14 = Object.freeze({
	default: config$4
});

var index$30 = createCommonjsModule(function (module) {
// Adapted from: http://stackoverflow.com/a/24891600/470339

var log2 = Math.log2 || function(n){ return Math.log(n) / Math.log(2); }
var trueRandom = (function() {
  var crypt = null;
  if (typeof(crypto) !== ''undefined'') {
      crypt = crypto;
  } else if (typeof(msCrypto) !== ''undefined'') {
      crypt = msCrypto;
  }

  if (crypt && crypt.getRandomValues) {
      // if we have a crypto library, use it
      var random = function(min, max) {
          var rval = 0;
          var range = max - min;
          if (range < 2) {
              return min;
          }

          var bits_needed = Math.ceil(log2(range));
          if (bits_needed > 53) {
            throw new Exception("We cannot generate numbers larger than 53 bits.");
          }
          var bytes_needed = Math.ceil(bits_needed / 8);
          var mask = Math.pow(2, bits_needed) - 1;
          // 7776 -> (2^13 = 8192) -1 == 8191 or 0x00001111 11111111

          // Create byte array and fill with N random numbers
          var byteArray = new Uint8Array(bytes_needed);
          crypt.getRandomValues(byteArray);

          var p = (bytes_needed - 1) * 8;
          for(var i = 0; i < bytes_needed; i++ ) {
              rval += byteArray[i] * Math.pow(2, p);
              p -= 8;
          }

          // Use & to apply the mask and reduce the number of recursive lookups
          rval = rval & mask;

          if (rval >= range) {
              // Integer out of acceptable range
              return random(min, max);
          }
          // Return an integer that falls within the range
          return min + rval;
      }
      return function() {
          var r = random(0, 1000000000) / 1000000000;
          return r;
      };
  } else {
      // From http://baagoe.com/en/RandomMusings/javascript/
      // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
      function Mash() {
          var n = 0xefc8249d;

          var mash = function(data) {
              data = data.toString();
              for (var i = 0; i < data.length; i++) {
                  n += data.charCodeAt(i);
                  var h = 0.02519603282416938 * n;
                  n = h >>> 0;
                  h -= n;
                  h *= n;
                  n = h >>> 0;
                  h -= n;
                  n += h * 0x100000000; // 2^32
              }
              return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
          };

          mash.version = ''Mash 0.9'';
          return mash;
      }

      // From http://baagoe.com/en/RandomMusings/javascript/
      function Alea() {
          return (function(args) {
              // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
              var s0 = 0;
              var s1 = 0;
              var s2 = 0;
              var c = 1;

              if (args.length == 0) {
                  args = [+new Date()];
              }
              var mash = Mash();
              s0 = mash('' '');
              s1 = mash('' '');
              s2 = mash('' '');

              for (var i = 0; i < args.length; i++) {
                  s0 -= mash(args[i]);
                  if (s0 < 0) {
                      s0 += 1;
                  }
                  s1 -= mash(args[i]);
                  if (s1 < 0) {
                      s1 += 1;
                  }
                  s2 -= mash(args[i]);
                  if (s2 < 0) {
                      s2 += 1;
                  }
              }
              mash = null;

              var random = function() {
                  var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
                  s0 = s1;
                  s1 = s2;
                  return s2 = t - (c = t | 0);
              };
              random.uint32 = function() {
                  return random() * 0x100000000; // 2^32
              };
              random.fract53 = function() {
                  return random() +
                      (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
              };
              random.version = ''Alea 0.9'';
              random.args = args;
              return random;

          }(Array.prototype.slice.call(arguments)));
      };
      return Alea();
  }
}());

module.exports = function() {
    return ''xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx''.replace(/[xy]/g, function(c)    {
      var r = trueRandom() * 16 | 0,
          v = c == ''x'' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
};
});

var index$31 = interopDefault(index$30);


var require$$0$24 = Object.freeze({
  default: index$31
});

var getGuid = createCommonjsModule(function (module) {
var db = interopDefault(require$$1$11);
var createGuid = interopDefault(require$$0$24);

/*
 * It seems more than a little silly to create an object store
 * where we''ll only ever store one value, but without access to
 * localStorage or cookies we can''t do much else.
 */

var GUID_KEY = "analytics-guid";

module.exports = function() {

    return db.store("clientGuid").get(GUID_KEY)
    .then(function (existingObject) {
        if (existingObject) {
            // If we already have one, return that
            return existingObject.guid;
        }
        
        // Otherwise, make a new one
        var newGuid = createGuid();
        
        // Store it in the DB
        return db.store("clientGuid").put(GUID_KEY, {guid:newGuid})
        .then(function () {
            // Then make sure we''re returning this guid, not the
            // db call result
            return newGuid;
        })
    })
}
});

var getGuid$1 = interopDefault(getGuid);


var require$$0$23 = Object.freeze({
    default: getGuid$1
});

var eventStore = createCommonjsModule(function (module) {
var db = interopDefault(require$$1$11);
var config = interopDefault(require$$1$14);
var getGuid = interopDefault(require$$0$23);

module.exports = {
    add: function add(call) {
        
        if (!config.GA_ID) {
            throw new Error("No analytics ID provided. Cannot log call.")
        }
        
        return getGuid()
        .then(function (guid) {
            // default values we don''t need to provide with every call
        
            var completeCall = Object.assign({}, call, {
                v: 1,
                tid: config.GA_ID,
                cid: guid
            });
            
            return db.store("analyticsPings").put({
                call: completeCall,
                timestamp: Date.now()
            })
        })

    },
    
    getAllPendingCalls: function getAllPendingCalls() {
        return db.store("analyticsPings").all()
        .then(function (allRecords) {
            
                
            return allRecords.map(function (record) {
                
                // qt time specifies the offset of when the event occurred:
                // https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#qt
           
                record.call.qt = Date.now() - record.timestamp
                
                return {
                    call: record.call,
                    id: record.id
                }

            })    
            
        })
    },
    
    deleteEvents: function deleteEvents(events) {
        var ids = events.map(function (e) { return e.id; });
        
        var mappedToPromises = ids.map(function (id) {
            return db.store("analyticsPings").del(id);
        })

        return Promise.all(mappedToPromises);
    }
}
});

var eventStore$1 = interopDefault(eventStore);
var add = eventStore.add;
var getAllPendingCalls = eventStore.getAllPendingCalls;
var deleteEvents = eventStore.deleteEvents;

var require$$1$10 = Object.freeze({
    default: eventStore$1,
    add: add,
    getAllPendingCalls: getAllPendingCalls,
    deleteEvents: deleteEvents
});

var index$34 = createCommonjsModule(function (module) {
''use strict'';
module.exports = function (str) {
	return encodeURIComponent(str).replace(/[!''()*]/g, function (c) {
		return ''%'' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};
});

var index$35 = interopDefault(index$34);


var require$$1$16 = Object.freeze({
	default: index$35
});

var index$36 = createCommonjsModule(function (module) {
''use strict'';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError(''Object.assign cannot be called with null or undefined'');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String(''abc'');  // eslint-disable-line
		test1[5] = ''de'';
		if (Object.getOwnPropertyNames(test1)[0] === ''5'') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2[''_'' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('''') !== ''0123456789'') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		''abcdefghijklmnopqrst''.split('''').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('''') !==
				''abcdefghijklmnopqrst'') {
			return false;
		}

		return true;
	} catch (e) {
		// We don''t expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var arguments$1 = arguments;

	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments$1[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};
});

var index$37 = interopDefault(index$36);


var require$$0$26 = Object.freeze({
	default: index$37
});

var index$32 = createCommonjsModule(function (module, exports) {
''use strict'';
var strictUriEncode = interopDefault(require$$1$16);
var objectAssign = interopDefault(require$$0$26);

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

exports.extract = function (str) {
	return str.split(''?'')[1] || '''';
};

exports.parse = function (str) {
	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== ''string'') {
		return ret;
	}

	str = str.trim().replace(/^(\?|#|&)/, '''');

	if (!str) {
		return ret;
	}

	str.split(''&'').forEach(function (param) {
		var parts = param.replace(/\+/g, '' '').split(''='');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join(''='') : undefined;

		key = decodeURIComponent(key);

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeURIComponent(val);

		if (ret[key] === undefined) {
			ret[key] = val;
		} else if (Array.isArray(ret[key])) {
			ret[key].push(val);
		} else {
			ret[key] = [ret[key], val];
		}
	});

	return ret;
};

exports.stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true
	};

	opts = objectAssign(defaults, opts);

	return obj ? Object.keys(obj).sort().map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '''';
		}

		if (val === null) {
			return key;
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().sort().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				if (val2 === null) {
					result.push(encode(key, opts));
				} else {
					result.push(encode(key, opts) + ''='' + encode(val2, opts));
				}
			});

			return result.join(''&'');
		}

		return encode(key, opts) + ''='' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join(''&'') : '''';
};
});

var index$33 = interopDefault(index$32);
var stringify$1 = index$32.stringify;
var parse$3 = index$32.parse;
var extract = index$32.extract;

var require$$0$25 = Object.freeze({
	default: index$33,
	stringify: stringify$1,
	parse: parse$3,
	extract: extract
});

var sync = createCommonjsModule(function (module) {
var EventStore = interopDefault(require$$1$10);
var querystring = interopDefault(require$$0$25);

var splitIntoGroupsOfTwenty = function (arr) {
    var batches = [];
    while (arr.length > 0) {
        batches.push(arr.splice(0,20));
    }
}

var hasBackgroundSyncSupport = typeof(self) !== ''undefined'' && self.registration && self.registration.sync;
var syncTag = ''analytics_sync'';

if (hasBackgroundSyncSupport) {
    self.addEventListener(''sync'', function (event) {
        if (event.tag !== syncTag) {
            return;
        }
        console.info("Running analytics sync task...")
        event.waitUntil(sync());
    })
}

var sendBatchRequest = function (batch) {
    
    if (batch.length === 0) {
        return Promise.resolve(true);
    }
    
    // Different endpoints for single requests and batched ones
    // not really clear why we''d use collect rather than just
    // always use batch, but let''s follow the spec
    
    var urlToSendTo = "https://www.google-analytics.com/";
    
    if (batch.length === 1) {
        urlToSendTo += "collect";
    } else {
        urlToSendTo += "batch";
    }
    
    var body = batch.map(function (b) { return querystring.stringify(b.call); }).join(''\n'');

    
    return fetch(urlToSendTo, {
        method: "POST",
        body: body
    })
    .then(function (res) {
        return res.status === 200;  
    })
}

var syncCurrentlyRunning = false;

var sync = function() {
    
    if (syncCurrentlyRunning === true) {
        // we only want to be running this once at a time,
        // otherwise we might end up sending events twice
        return Promise.resolve();
    }
    console.info("Running analytics sync...")
    syncCurrentlyRunning = true;
    
    return EventStore.getAllPendingCalls()
    .then(function (allCalls) {
        
        if (allCalls.length === 0) {
            return false;
        }
        
        // The batch call endpoint only allows a maximum of 20 calls,
        // so we''ll only send 20 at a time.
        
        var first20 = allCalls.slice(0, 20);
        
        return sendBatchRequest(first20)
        .then(function (wasSuccessful) {
            if (wasSuccessful === false) {
                return false;
            }
            
            return EventStore.deleteEvents(first20)
            .then(function () {
                return true;
            })
        })
        
       
        
    })
    .then(function (runAgain) {
        syncCurrentlyRunning = false;
        if (runAgain) {
            return sync();
        }
    })
    .catch(function (err) {

        // Was trying to use service worker sync, but it fails when
        // it doesn''t have a window context:

        // "You can only register for a sync event when the user has a window open to the site."
        // https://developers.google.com/web/updates/2015/12/background-sync?hl=en

        // if sync failed, register to retry next time.
        //console.warn("Requesting sync task to send analytics");
        //self.registration.sync.register(syncTag);
    })
}

module.exports = sync;
});

var sync$1 = interopDefault(sync);


var require$$1$15 = Object.freeze({
    default: sync$1
});

var index$20 = createCommonjsModule(function (module) {
var eventStore = interopDefault(require$$1$10);
var sync = interopDefault(require$$1$15);
var config = interopDefault(require$$1$14);

var promiseDelay = function (delay) {
    return new Promise(function (fulfill) { return setTimeout(fulfill, delay); });
}

var warnedAboutNoID = false;

module.exports = function(call, returnSyncPromise) {
    if ( returnSyncPromise === void 0 ) returnSyncPromise = false;

    
    if (!config.GA_ID) {
        if (warnedAboutNoID === false) {
            console.warn("Need to specify analytics ID with setAnalyticsID() before sending any calls. Will not send any in this session.");
            warnedAboutNoID = true;
        }
        console.info("Analytics call:", call);
        return Promise.resolve();
    }
    
    return eventStore.add(call)
    .then(function () {
        // Sometimes we run analytics calls in multiple succession
        // so let''s add a small delay to encourage batching.
        return promiseDelay(500);
    })
    .then(function () {
        
        var syncPromise = sync();
        if (returnSyncPromise) {
            // mostly just for testing
            return syncPromise;
        } else {
            // We are NOT returning sync because we don''t want any existing
            // promise chain to wait for it to complete.
        }
    })
}

module.exports.setAnalyticsID = function(id) {
    config.GA_ID = id;
}
});

var index$21 = interopDefault(index$20);
var setAnalyticsID = index$20.setAnalyticsID;

var require$$0$18 = Object.freeze({
    default: index$21,
    setAnalyticsID: setAnalyticsID
});

var analyticsWithContext = createCommonjsModule(function (module) {
var analytics = interopDefault(require$$0$18);

module.exports = function (opts, context) {
  
    if (context && context.analyticsData) {
        opts = Object.assign({}, context.analyticsData, opts);
    }
    
    analytics(opts);
}
});

var analyticsWithContext$1 = interopDefault(analyticsWithContext);


var require$$1$9 = Object.freeze({
  default: analyticsWithContext$1
});

var notification = createCommonjsModule(function (module) {
var getRegistration = interopDefault(require$$1$4);
var analytics = interopDefault(require$$1$9);
var run = interopDefault(require$$1$8);

var mapActionsToNotification = function(notification, actions) {
    
    /*
        We can''t store data against notification actions themselves, all
        we can do is store a string. So instead we store our command data
        in the data attribute of the notification itself, and just set a
        index property on the ''action'' property. Later, when processing 
        a notification click, we read that data back out again.
    */
    
    notification.actions = [];
    notification.data = notification.data || {};
    notification.data.commandSequences = [];
    notification.data.commandToActionLabelMap = [];
    notification.actions = [];
    
    actions.forEach(function (action) {
        
        notification.data.commandSequences.push(action.commands);
        var commandString = "__command::" + String(notification.data.commandSequences.length - 1);

        notification.actions.push(Object.assign(action.template, {
            action: commandString
        }));
        
        // We use this in analytics to track which button was actually pressed
        //Use actionID to uniquely identify the action
        notification.data.commandToActionLabelMap.push(action.template.title + (action.actionID ? ''-'' + action.actionID : ''''));
    })
};

var getNotificationID = function(baseObj) {
    
    var backupTitle = baseObj.title;

    // This is messy because we''re dealing with different source objects.
    
    if (baseObj && baseObj.options) {
        baseObj = baseObj.options;
    }

    
    if (!baseObj || !baseObj.data || !baseObj.data.notificationID) {
        if (backupTitle) {
            console.warn("Notification does not have ID, using title")
            return backupTitle
        } else {
            console.error("Notification does not have an ID.")
            return null;
        }
        
    }
    return baseObj.data.notificationID;
}

var notification = {
    show: function(opts, event, context) {
        if (opts.actionCommands) {
            mapActionsToNotification(opts.options, opts.actionCommands);
        }

        var swapNotificationActions = opts.swapNotificationActions;

        if (context && opts.options) {
            // We can pass context through notifications
            opts.options.data = opts.options.data || {};
            opts.options.data.context = context;
            if (swapNotificationActions !== true && swapNotificationActions !== false) {
                swapNotificationActions = context.swapNotificationActions
            }
            
        }

        if (swapNotificationActions === true && opts.options && opts.options.actions.length > 1) {
            var newFirstAction = opts.options.actions[1];
            var newSecondAction = opts.options.actions[0];

            opts.options.actions = [
                newFirstAction,
                newSecondAction
            ]
        }

        

        var notificationID = getNotificationID(opts);
        
        return getRegistration().showNotification(opts.title, opts.options)
        .then(function () {
            analytics({
                t: ''event'',
                ec: ''Notification'',
                ea: ''show'',
                el: opts.title,
                // This requires you to have a custom dimension set up to record notification IDs
                cd1: notificationID
            }, context)
        })
    },
    close: function(opts, event) {
        if (opts && opts.tag) {
            return getRegistration().getNotifications({tag: opts.tag})
            .then(function (notifications) {
                notifications.forEach(function (n) { return n.close(); });
            })
        } else if (event) {
            event.notification.close();
        }
        
        return Promise.resolve();
    },
    parseNotificationAction: function(event) {
            debugger;
        Promise.resolve()
        .then(function () {
            var context = event.notification.data ? event.notification.data.context : null;
            if (event.action === '''' && event.notification.data && event.notification.data.onTap) {
                return event.waitUntil(
                    run("commandSequence", {
                        sequence: event.notification.data.onTap,
                        event: event,
                        context: context
                    })
                    .then(function () {
                        analytics({
                            t: ''event'',
                            ec: ''Notification'',
                            ea: ''tap'',
                            el: event.notification.title,
                            cd1: getNotificationID(event.notification)
                        }, context)
                    })
                    .catch(function (err) {
                        console.error(err)
                    })
                );
            }
        
        
            if (event.action && event.action.indexOf(''__command'') === 0) {
                // it''s an action mapped to a command sequence.

                var sequenceIndex = parseInt(event.action.split("::")[1], 10);
                var commandSequence = event.notification.data.commandSequences[sequenceIndex];
                var actionLabel = event.notification.data.commandToActionLabelMap[sequenceIndex];
                
                return event.waitUntil(
                    run("commandSequence", {
                        sequence: commandSequence,
                        event: event,
                        context: context
                    }).then(function () {
                        analytics({
                            t: ''event'',
                            ec: ''Notification'',
                            ea: ''tap-action'',
                            el: actionLabel,
                            cd1: getNotificationID(event.notification)
                        }, context)
                    })
                    .catch(function (err) {
                        console.error(err)
                    })
                );
            }

            
        })
        .catch(function (err) {
            console.error(err.message);
        })
        
    },
    parseNotificationClose: function parseNotificationClose(event) {
        
        analytics({
            t: ''event'',
            ec: ''Notification'',
            ea: ''close'',
            el: event.notification.title,
            cd1: getNotificationID(event.notification)
        })
        
        if (!event.notification.data || !event.notification.data.onClose) {
            return;
        }
        return event.waitUntil(
            run("commandSequence", {
                sequence: event.notification.data.onClose,
                event: event
            })
        );
    },
    receivePush: function receivePush(event) {
      
        var obj = event.data.json();
        
        console.log(obj.data)
        if (obj.data && obj.data.payload) {
            // For Firebase notifications
            obj = JSON.parse(obj.data.payload)
        }

        console.log("received push", obj);

        if (obj instanceof Array) {
            event.waitUntil(
                run("commandSequence", {
                    sequence: obj
                })
            );
            analytics({
                t: ''event'',
                ec: ''Push'',
                ea: ''received''
            });
        } else {
            event.waitUntil(
                run("commandSequence", {
                    sequence: obj.commands
                })
            );
            analytics({
                t: ''event'',
                ec: ''Push'',
                ea: ''received'',
                el: obj.pushId
            });
        }
        
        
        
    },
    addListeners: function addListeners() {
        self.addEventListener(''notificationclick'', notification.parseNotificationAction);
        self.addEventListener(''notificationclose'', notification.parseNotificationClose);
        self.addEventListener(''push'', notification.receivePush);
    }
}

module.exports = notification;
});

var notification$1 = interopDefault(notification);


var require$$11 = Object.freeze({
    default: notification$1
});

var commandSequence = createCommonjsModule(function (module) {
var PromiseTools = interopDefault(require$$0$7);
var run = interopDefault(require$$1$8);

module.exports = function (ref) {
    var sequence = ref.sequence;
    var event = ref.event;
    var context = ref.context; if ( context === void 0 ) context = {};

    var chainMappedToCommands = sequence.map(function (ref) {
        var command = ref.command;
        var options = ref.options;

        return function () { return run(command, options, event, context); };
    })
    
    return PromiseTools.series(chainMappedToCommands);
};
});

var commandSequence$1 = interopDefault(commandSequence);


var require$$0$27 = Object.freeze({
    default: commandSequence$1
});

var browser = createCommonjsModule(function (module) {
function resolveURL(url) {
    
    if (url.indexOf(''://'') > -1) {
        // already full URL
        return url;
    }

    if (url[0] === ''/'') {
        // is relative to root
        var hostname = /([a-z]*):\/\/(.*?)\//.exec(self.registration.scope);
        return hostname[1] + "://" + hostname[2] + url;
    }

    if (self.registration.scope.substr(-1) === ''/'') {
        // Scope ends with slash, that''s easy
        return self.registration.scope + url;
    }

    // Otherwise get relative to the directory, then apply
    var scopeSplit = self.registration.scope.split(''/'');

    scopeSplit.pop();

    return scopeSplit.join("/") + url;


}


module.exports = {
    openURL: function(ref) {
        var url = ref.url;
        var options = ref.options;


        var urlRelativeToScope = resolveURL(url);

        return clients.matchAll({
            includeUncontrolled: true
        }).then(function(clientList) {
            console.log("CLIENT: do list")
            try {
                for (var i = 0; i < clientList.length; i++) {
                    console.log("open URL:" + urlRelativeToScope)
                    console.log("client URL: " + clientList[i].url + ", has focus: " + String(''focus'' in clientList[i]))
                    if (clientList[i].url === urlRelativeToScope && ''focus'' in clientList[i]) {
                        return clientList[i].focus();
                    } 
                }
            } catch (err) {
                console.error(err);
            }
            console.log("CLIENT: open window")
            return clients.openWindow(url, options);
        });
        
    }
}
});

var browser$1 = interopDefault(browser);
var openURL = browser.openURL;

var require$$8 = Object.freeze({
    default: browser$1,
    openURL: openURL
});

var ballotbox = createCommonjsModule(function (module) {
var config = interopDefault(require$$0$6);

var ballotRequest = function(api) {
    return function(endpoint, method, body) {
        if ( method === void 0 ) method = ''GET'';
        if ( body === void 0 ) body = '''';


        if (!config.ballot || !config.ballot.key || !config.ballot.host) {
            throw new Error("Must set poll key and host");
        }

        return fetch(config.ballot.host + api + endpoint, {
            method: method,
            headers: {
                ''Accept'': ''application/json'',
                ''Content-type'': ''application/json'',
                ''X-Ballot-API-Key'': config.ballot.key
            },
            body: JSON.stringify(body)
        });
    }
};

module.exports = {
    pollRequest: ballotRequest(''/polls''),
    quizRequest: ballotRequest(''/quizzes'')
};
});

var ballotbox$1 = interopDefault(ballotbox);
var pollRequest = ballotbox.pollRequest;
var quizRequest = ballotbox.quizRequest;

var require$$2$4 = Object.freeze({
    default: ballotbox$1,
    pollRequest: pollRequest,
    quizRequest: quizRequest
});

var poll = createCommonjsModule(function (module) {
var getRegistration = interopDefault(require$$1$4);
var config = interopDefault(require$$0$6);
var ballotRequest = interopDefault(require$$2$4);
var pollRequest = ballotRequest.pollRequest;

module.exports = {
    castVote: function (ref) {
        var pollId = ref.pollId;
        var answerId = ref.answerId;

        getRegistration().pushManager.getSubscription().then(function (subscription) {
            return pollRequest(''/'' + pollId + ''/vote'', ''POST'', {
                answerId: answerId,
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            });
        });
    },
    pollResults: function(ref) {
        var pollId = ref.pollId;

        getRegistration().pushManager.getSubscription().then(function (subscription) {
            return pollRequest(''/'' + pollId + ''/results'', ''POST'', {
                user: {
                    id: subscription.endpoint,
                    subscription: subscription
                }
            })
        });
    }
};
});

var poll$1 = interopDefault(poll);
var castVote = poll.castVote;
var pollResults = poll.pollResults;

var require$$7 = Object.freeze({
    default: poll$1,
    castVote: castVote,
    pollResults: pollResults
});

var quiz = createCommonjsModule(function (module) {
var getRegistration = interopDefault(require$$1$4);
var ballotRequest = interopDefault(require$$2$4);
var quizRequest = ballotRequest.quizRequest;
var run = interopDefault(require$$1$8);
var db = interopDefault(require$$0$8);

var quizAnswers = db.store("quizAnswers");
var notificationStore = db.store("notificationChains");

function QuizStore() {

    this.addAnswer = function(quizId, questionId, answerId, correctAnswer) {
        quizAnswers.put({
            "answerId": answerId,
            "questionId": questionId,
            "quizId": quizId,
            "correctAnswer": correctAnswer
        });
    };

    this.getAnswers = function(quizId) {
        return quizAnswers
            .index("byQuiz")
            .get(quizId);
    }
}

var quizStore = new QuizStore();

module.exports = {
    answerQuestion: function(ref) {
        var quizId = ref.quizId;
        var questionId = ref.questionId;
        var answerId = ref.answerId;
        var correctAnswer = ref.correctAnswer;
        var showNotification = ref.showNotification;

        quizStore.addAnswer(quizId, questionId, answerId, correctAnswer);

        return run("notification.show", showNotification);
    },

    submitAnswers: function (ref) {
        var quizId = ref.quizId;
        var chain = ref.chain;

        notificationStore
            .index("byChain")
            .get(chain)
            .then(function (chainItems) {
                if (chainItems.length === 0) {
                    return console.error("No chain with the name: ", chain)
                }

                quizStore.getAnswers(quizId).then(function (answers) {
                    var correctAnswers = answers.filter(function (a) { return a.correctAnswer; });

                    run("notification.show", chainItems[correctAnswers.length]);

                    getRegistration().pushManager.getSubscription().then(function (subscription) {
                        return quizRequest(''/'' + quizId + ''/submit'', ''POST'', {
                            answers: answers,
                            user: {
                                id: subscription.endpoint,
                                subscription: subscription
                            }
                        });
                    }).catch(function (err) {
                        console.log(err);
                    });
                })
            });
    }
};
});

var quiz$1 = interopDefault(quiz);
var answerQuestion = quiz.answerQuestion;
var submitAnswers = quiz.submitAnswers;

var require$$6 = Object.freeze({
    default: quiz$1,
    answerQuestion: answerQuestion,
    submitAnswers: submitAnswers
});

var fromUrl = createCommonjsModule(function (module) {
var run = interopDefault(require$$1$8);
var commandSequence = interopDefault(require$$0$27);

module.exports = function (ref) {
    var url = ref.url;
    var fetchOpts = ref.fetchOpts;

    return fetch(url, fetchOpts)
    .then(function (res) { return res.json(); })
    .then(function (json) {
        return commandSequence({
            sequence: json
        })
    })
}
});

var fromUrl$1 = interopDefault(fromUrl);


var require$$5 = Object.freeze({
    default: fromUrl$1
});

var cache = createCommonjsModule(function (module) {
var PromiseTools = interopDefault(require$$0$7);

module.exports = {
    addToCache: function addToCache(opts) {
        return caches.open(opts.cacheName)
        .then(function(cache) {
            return cache.addAll(opts.urls);
        })
    },
    clear: function clear(opts) {
        return caches.open(opts.cacheName)
        .then(function (cache) {
            return cache.keys()
            .then(function (keys) {
                return PromiseTools.map(keys, function (key) { return cache.delete(key); })
            })
        })
    },
    delete: function delete$1(opts) {
        return caches.open(opts.cacheName)
        .then(function (cache) {
            return PromiseTools.map(opts.urls, function (url) { return cache.delete(url); })
        })   
    }
}
});

var cache$1 = interopDefault(cache);
var addToCache = cache.addToCache;
var clear = cache.clear;

var require$$3 = Object.freeze({
    default: cache$1,
    addToCache: addToCache,
    clear: clear
});

var context = createCommonjsModule(function (module) {
var customOperations = {
    randomBool: function() {
        return Math.random() >= 0.5
    }
}

module.exports = {
    set: function(opts, event, context) {
        if (!context) {
            throw new Error("Tried to set context when one does not exist");
        }

        var commandRegex = /\{\{(.*)\}\}/

        for (var key in opts.context) {
            var value = opts.context[key];
            
            if (typeof value !== "string") {
                continue;
            }

            var regexResult = commandRegex.exec(value);

            if (!regexResult || ! customOperations[regexResult[1]]) {
                continue;
            }

            var operation = customOperations[regexResult[1]];

            var newValue = operation();
            console.info(("Operation " + (regexResult[1]) + " called for " + key + ", new value is " + newValue))
            opts.context[key] = newValue;

            // Need to make this resusable... somehow. Difficult when GA
            // requires hard-coded custom variable indexes.
            
            if (value === ''{{randomBool}}'') {
                opts.context.analyticsData = {
                    cd2: String(newValue)
                }
            }
        }

        Object.assign(context, opts.context);
    }
}
});

var context$1 = interopDefault(context);
var set = context.set;

var require$$2$5 = Object.freeze({
    default: context$1,
    set: set
});

var pushkinFirebase = createCommonjsModule(function (module) {
var getRegistration = interopDefault(require$$1$4);
var config = interopDefault(require$$0$6);

var pushkinRequest = function(endpoint, method, body) {
    if ( method === void 0 ) method = ''GET'';
    if ( body === void 0 ) body = null;

   
    if (!config.pushkinFirebase || !config.pushkinFirebase.key || !config.pushkinFirebase.host) {
        throw new Error("Must set both pushkin key and host config variables");
    }
    
    var headers = new Headers();
    headers.set(''Authorization'', config.pushkinFirebase.key);
    headers.set(''Content-Type'', ''application/json'');
    
    return fetch(config.pushkinFirebase.host + endpoint, {
        method: method,
        mode: ''cors'',
        headers: headers,
        body: body ? JSON.stringify(body) : null
    })
    .then(function (response) {
        if (response.status < 200 || response.status > 299) {
            return response.text()
            .then(function (text) {
                throw new Error(text);
            })
        }
        return response.json()
        .then(function (json) {
            if (json.errorMessage) {
                throw new Error(json.errorMessage);
            }
            return json;
        })
    })
};



var getSubscriptionID = function() {
    return getRegistration().pushManager.getSubscription()
    .then(function (sub) {
        if (!sub) {
            throw new Error("No subscription to check")
        }
        return pushkinRequest("/registrations", "POST", {
            subscription: sub
        })
        .then(function (res) {
            return res.id;
        })
    })
}

module.exports = {
    subscribeToTopic: function(opts) {  

        var confirmOpts = {};

        if (opts.confirmationPayload) {
            confirmOpts.confirmation_notification = {
                ttl: 60,
                payload: opts.confirmationPayload,
                service_worker_url: self.registration.active.scriptURL,
                priority: ''high''
            }
        }

        // need to call subscribe to make sure we have the remote endpoint

        return getRegistration().pushManager.subscribe()
        .then(function (sub) {
            return getSubscriptionID()
        })
        .then(function (subId) {
            return pushkinRequest(("/topics/" + (opts.topic) + "/subscribers/" + (encodeURIComponent(subId))), ''POST'', confirmOpts)
        })
    },
    unsubscribeFromTopic: function(opts) {
        return getSubscriptionID()
        .then(function (subId) {
            return pushkinRequest(("/topics/" + (opts.topic) + "/subscribers/" + (encodeURIComponent(subId))), ''DELETE'', opts)
        })
    },
    getSubscribedTopics: function(opts) {
        return getSubscriptionID()
        .then(function (subId) {
            return pushkinRequest(("/registrations/" + (encodeURIComponent(subId)) + "/topics"))
        })
    }
}
});

var pushkinFirebase$1 = interopDefault(pushkinFirebase);
var subscribeToTopic$1 = pushkinFirebase.subscribeToTopic;
var unsubscribeFromTopic$1 = pushkinFirebase.unsubscribeFromTopic;
var getSubscribedTopics$1 = pushkinFirebase.getSubscribedTopics;

var require$$1$17 = Object.freeze({
   default: pushkinFirebase$1,
   subscribeToTopic: subscribeToTopic$1,
   unsubscribeFromTopic: unsubscribeFromTopic$1,
   getSubscribedTopics: getSubscribedTopics$1
});

var video = createCommonjsModule(function (module) {
// This is for iOS only

module.exports = {
    playOrPause: function playOrPause(opts, event) {
        var video = event.notification.video;
        if (video.isPlaying) {
            video.pause();
        } else {
            video.play();
        }
    },
    muteOrUnmute: function muteOrUnmute(opts, event) {
        var video = event.notification.video;
        if (video.isMuted) {
            video.unmute();
        } else {
            video.mute();
        }
    }
}
});

var video$1 = interopDefault(video);
var playOrPause = video.playOrPause;
var muteOrUnmute = video.muteOrUnmute;

var require$$0$28 = Object.freeze({
    default: video$1,
    playOrPause: playOrPause,
    muteOrUnmute: muteOrUnmute
});

var index$3 = createCommonjsModule(function (module) {
var pushy = interopDefault(require$$13);
var chains = interopDefault(require$$12);
var notification = interopDefault(require$$11);
var commandSequence = interopDefault(require$$0$27);
var runCommand = interopDefault(require$$1$8);
var browser = interopDefault(require$$8);
var poll = interopDefault(require$$7);
var quiz = interopDefault(require$$6);
var fromURL = interopDefault(require$$5);
var config = interopDefault(require$$0$6);
var cache = interopDefault(require$$3);
var context = interopDefault(require$$2$5);
var pushkinFirebase = interopDefault(require$$1$17)
var video = interopDefault(require$$0$28);


var commands = {
    pushy: pushy,
    chains: chains,
    notification: notification,
    commandSequence: commandSequence,
    browser: browser,
    fromURL: fromURL,
    cache: cache,
    poll: poll,
    context: context,
    quiz: quiz,
    pushkinFirebase: pushkinFirebase,
    video: video,
    update: function () { return self.registration.update(); }
};

runCommand.commands = commands;
notification.addListeners();

var registerWithBridge = function(bridge) {
    var namespaces = Object.keys(commands);
    
    namespaces.forEach(function (name) {
        var commandObj = commands[name];
        
        if (typeof commandObj === "function") {
            bridge.bind(name, commandObj);
            return;
        }
        
        
        var functionNames = Object.keys(commandObj);
        
        functionNames.forEach(function (funcName) {
            bridge.bind(name + ''.'' + funcName, commandObj[funcName]);
        })
        
    })
};

module.exports = {
    register: registerWithBridge,
    commands: commands,
    setConfig: config.update,
    run: runCommand
};
});

var notificationCommands = interopDefault(index$3);

var index$39 = createCommonjsModule(function (module) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case ''[object Date]'': return ''date'';
    case ''[object RegExp]'': return ''regexp'';
    case ''[object Arguments]'': return ''arguments'';
    case ''[object Array]'': return ''array'';
    case ''[object Error]'': return ''error'';
  }

  if (val === null) return ''null'';
  if (val === undefined) return ''undefined'';
  if (val !== val) return ''nan'';
  if (val && val.nodeType === 1) return ''element'';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};
});

var index$40 = interopDefault(index$39);


var require$$1$18 = Object.freeze({
  default: index$40
});

var index$43 = createCommonjsModule(function (module) {
''use strict'';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === ''[object Object]'' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};
});

var index$44 = interopDefault(index$43);


var require$$0$30 = Object.freeze({
	default: index$44
});

var index$41 = createCommonjsModule(function (module, exports) {
''use strict'';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;

var _isPlainObj = interopDefault(require$$0$30);

var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parse `opts` to valid IDBKeyRange.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
 *
 * @param {Object} opts
 * @return {IDBKeyRange}
 */

function range(opts) {
  var IDBKeyRange = commonjsGlobal.IDBKeyRange || commonjsGlobal.webkitIDBKeyRange;
  if (opts instanceof IDBKeyRange) return opts;
  if (typeof opts === ''undefined'' || opts === null) return null;
  if (!(0, _isPlainObj2.default)(opts)) return IDBKeyRange.only(opts);
  var keys = Object.keys(opts).sort();

  if (keys.length === 1) {
    var key = keys[0];
    var val = opts[key];

    switch (key) {
      case ''eq'':
        return IDBKeyRange.only(val);
      case ''gt'':
        return IDBKeyRange.lowerBound(val, true);
      case ''lt'':
        return IDBKeyRange.upperBound(val, true);
      case ''gte'':
        return IDBKeyRange.lowerBound(val);
      case ''lte'':
        return IDBKeyRange.upperBound(val);
      default:
        throw new TypeError(''"'' + key + ''" is not valid key'');
    }
  } else {
    var x = opts[keys[0]];
    var y = opts[keys[1]];
    var pattern = keys.join(''-'');

    switch (pattern) {
      case ''gt-lt'':
        return IDBKeyRange.bound(x, y, true, true);
      case ''gt-lte'':
        return IDBKeyRange.bound(x, y, true, false);
      case ''gte-lt'':
        return IDBKeyRange.bound(x, y, false, true);
      case ''gte-lte'':
        return IDBKeyRange.bound(x, y, false, false);
      default:
        throw new TypeError(''"'' + pattern + ''" are conflicted keys'');
    }
  }
}
module.exports = exports[''default''];
});

var index$42 = interopDefault(index$41);


var require$$0$29 = Object.freeze({
  default: index$42
});

var idbStore$4 = createCommonjsModule(function (module) {
var type = interopDefault(require$$1$18);
var parseRange = interopDefault(require$$0$29);

/**
 * Expose `Store`.
 */

module.exports = Store;

/**
 * Initialize new `Store`.
 *
 * @param {String} name
 * @param {Object} opts
 */

function Store(name, opts) {
  this.db = null;
  this.name = name;
  this.indexes = {};
  this.opts = opts;
  this.key = opts.key || opts.keyPath || undefined;
  this.increment = opts.increment || opts.autoIncretement || undefined;
}

/**
 * Get index by `name`.
 *
 * @param {String} name
 * @return {Index}
 */

Store.prototype.index = function(name) {
  return this.indexes[name];
};

/**
 * Put (create or replace) `key` to `val`.
 *
 * @param {String|Object} [key] is optional when store.key exists.
 * @param {Any} val
 * @param {Function} cb
 */

Store.prototype.put = function(key, val, cb) {
  var name = this.name;
  var keyPath = this.key;
  if (keyPath) {
    if (type(key) == ''object'') {
      cb = val;
      val = key;
      key = null;
    } else {
      val[keyPath] = key;
    }
  }

  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = keyPath ? objectStore.put(val) : objectStore.put(val, key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb(null, req.result) };
  });
};

/**
 * Get `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.get = function(key, cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.get(key);
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Del `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.del = function(key, cb) {
  var name = this.name;
  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.delete(key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Count.
 *
 * @param {Function} cb
 */

Store.prototype.count = function(cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.count();
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Clear.
 *
 * @param {Function} cb
 */

Store.prototype.clear = function(cb) {
  var name = this.name;
  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.clear();
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Perform batch operation.
 *
 * @param {Object} vals
 * @param {Function} cb
 */

Store.prototype.batch = function(vals, cb) {
  var name = this.name;
  var keyPath = this.key;
  var keys = Object.keys(vals);

  this.db.transaction(''readwrite'', [name], function(err, tr) {
    if (err) return cb(err);
    var store = tr.objectStore(name);
    var current = 0;
    tr.onerror = tr.onabort = cb;
    tr.oncomplete = function oncomplete() { cb() };
    next();

    function next() {
      if (current >= keys.length) return;
      var currentKey = keys[current];
      var currentVal = vals[currentKey];
      var req;

      if (currentVal === null) {
        req = store.delete(currentKey);
      } else if (keyPath) {
        if (!currentVal[keyPath]) currentVal[keyPath] = currentKey;
        req = store.put(currentVal);
      } else {
        req = store.put(currentVal, currentKey);
      }

      req.onerror = cb;
      req.onsuccess = next;
      current += 1;
    }
  });
};

/**
 * Get all.
 *
 * @param {Function} cb
 */

Store.prototype.all = function(cb) {
  var result = [];

  this.cursor({ iterator: iterator }, function(err) {
    err ? cb(err) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Create read cursor for specific `range`,
 * and pass IDBCursor to `iterator` function.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
 *
 * @param {Object} opts:
 *   {IDBRange|Object} range - passes to .openCursor()
 *   {Function} iterator - function to call with IDBCursor
 *   {String} [index] - name of index to start cursor by index
 * @param {Function} cb - calls on end or error
 */

Store.prototype.cursor = function(opts, cb) {
  var name = this.name;
  this.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var store = opts.index
      ? tr.objectStore(name).index(opts.index)
      : tr.objectStore(name);
    var req = store.openCursor(parseRange(opts.range));

    req.onerror = cb;
    req.onsuccess = function onsuccess(e) {
      var cursor = e.target.result;
      cursor ? opts.iterator(cursor) : cb();
    };
  });
};
});

var idbStore$5 = interopDefault(idbStore$4);


var require$$1$19 = Object.freeze({
  default: idbStore$5
});

var idbIndex$4 = createCommonjsModule(function (module) {
var parseRange = interopDefault(require$$0$29);

/**
 * Expose `Index`.
 */

module.exports = Index;

/**
 * Initialize new `Index`.
 *
 * @param {Store} store
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} opts { unique: false, multi: false }
 */

function Index(store, name, field, opts) {
  this.store = store;
  this.name = name;
  this.field = field;
  this.opts = opts;
  this.multi = opts.multi || opts.multiEntry || false;
  this.unique = opts.unique || false;
}

/**
 * Get `key`.
 *
 * @param {Object|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.get = function(key, cb) {
  var result = [];
  var isUnique = this.unique;
  var opts = { range: key, iterator: iterator };

  this.cursor(opts, function(err) {
    if (err) return cb(err);
    isUnique ? cb(null, result[0]) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Count records by `key`.
 *
 * @param {String|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.count = function(key, cb) {
  var name = this.store.name;
  var indexName = this.name;

  this.store.db.transaction(''readonly'', [name], function(err, tr) {
    if (err) return cb(err);
    var index = tr.objectStore(name).index(indexName);
    var req = index.count(parseRange(key));
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Create cursor.
 * Proxy to `this.store` for convinience.
 *
 * @param {Object} opts
 * @param {Function} cb
 */

Index.prototype.cursor = function(opts, cb) {
  opts.index = this.name;
  this.store.cursor(opts, cb);
};
});

var idbIndex$5 = interopDefault(idbIndex$4);


var require$$0$31 = Object.freeze({
  default: idbIndex$5
});

var schema$8 = createCommonjsModule(function (module) {
var type = interopDefault(require$$1$18);
var Store = interopDefault(require$$1$19);
var Index = interopDefault(require$$0$31);

/**
 * Expose `Schema`.
 */

module.exports = Schema;

/**
 * Initialize new `Schema`.
 */

function Schema() {
  if (!(this instanceof Schema)) return new Schema();
  this._stores = {};
  this._current = {};
  this._versions = {};
}

/**
 * Set new version.
 *
 * @param {Number} version
 * @return {Schema}
 */

Schema.prototype.version = function(version) {
  if (type(version) != ''number'' || version < 1 || version < this.getVersion())
    throw new TypeError(''not valid version'');

  this._current = { version: version, store: null };
  this._versions[version] = {
    stores: [],      // db.createObjectStore
    dropStores: [],  // db.deleteObjectStore
    indexes: [],     // store.createIndex
    dropIndexes: [], // store.deleteIndex
    version: version // version
  };

  return this;
};

/**
 * Add store.
 *
 * @param {String} name
 * @param {Object} [opts] { key: false }
 * @return {Schema}
 */

Schema.prototype.addStore = function(name, opts) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (this._stores[name]) throw new TypeError(''store is already defined'');
  var store = new Store(name, opts || {});
  this._stores[name] = store;
  this._versions[this.getVersion()].stores.push(store);
  this._current.store = store;
  return this;
};

/**
 * Drop store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropStore = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  var store = this._stores[name];
  if (!store) throw new TypeError(''store is not defined'');
  delete this._stores[name];
  this._versions[this.getVersion()].dropStores.push(store);
  return this;
};

/**
 * Add index.
 *
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} [opts] { unique: false, multi: false }
 * @return {Schema}
 */

Schema.prototype.addIndex = function(name, field, opts) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (type(field) != ''string'' && type(field) != ''array'') throw new TypeError(''`field` is required'');
  var store = this._current.store;
  if (store.indexes[name]) throw new TypeError(''index is already defined'');
  var index = new Index(store, name, field, opts || {});
  store.indexes[name] = index;
  this._versions[this.getVersion()].indexes.push(index);
  return this;
};

/**
 * Drop index.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropIndex = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  var index = this._current.store.indexes[name];
  if (!index) throw new TypeError(''index is not defined'');
  delete this._current.store.indexes[name];
  this._versions[this.getVersion()].dropIndexes.push(index);
  return this;
};

/**
 * Change current store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.getStore = function(name) {
  if (type(name) != ''string'') throw new TypeError(''`name` is required'');
  if (!this._stores[name]) throw new TypeError(''store is not defined'');
  this._current.store = this._stores[name];
  return this;
};

/**
 * Get version.
 *
 * @return {Number}
 */

Schema.prototype.getVersion = function() {
  return this._current.version;
};

/**
 * Generate onupgradeneeded callback.
 *
 * @return {Function}
 */

Schema.prototype.callback = function() {
  var versions = Object.keys(this._versions)
    .map(function(v) { return this._versions[v] }, this)
    .sort(function(a, b) { return a.version - b.version });

  return function onupgradeneeded(e) {
    var db = e.target.result;
    var tr = e.target.transaction;

    versions.forEach(function(versionSchema) {
      if (e.oldVersion >= versionSchema.version) return;

      versionSchema.stores.forEach(function(s) {
        var options = {};

        // Only pass the options that are explicitly specified to createObjectStore() otherwise IE/Edge
        // can throw an InvalidAccessError - see https://msdn.microsoft.com/en-us/library/hh772493(v=vs.85).aspx
        if (typeof s.key !== ''undefined'') options.keyPath = s.key;
        if (typeof s.increment !== ''undefined'') options.autoIncrement = s.increment;

        db.createObjectStore(s.name, options);
      });

      versionSchema.dropStores.forEach(function(s) {
        db.deleteObjectStore(s.name);
      });

      versionSchema.indexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.createIndex(i.name, i.field, {
          unique: i.unique,
          multiEntry: i.multi
        });
      });

      versionSchema.dropIndexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.deleteIndex(i.name);
      });
    });
  };
};
});

var schema$9 = interopDefault(schema$8);


var require$$2$6 = Object.freeze({
  default: schema$9
});

var index$38 = createCommonjsModule(function (module, exports) {
var type = interopDefault(require$$1$18);
var Schema = interopDefault(require$$2$6);
var Store = interopDefault(require$$1$19);
var Index = interopDefault(require$$0$31);

/**
 * Expose `Treo`.
 */

exports = module.exports = Treo;

/**
 * Initialize new `Treo` instance.
 *
 * @param {String} name
 * @param {Schema} schema
 */

function Treo(name, schema) {
  if (!(this instanceof Treo)) return new Treo(name, schema);
  if (type(name) != ''string'') throw new TypeError(''`name` required'');
  if (!(schema instanceof Schema)) throw new TypeError(''not valid schema'');

  this.name = name;
  this.status = ''close'';
  this.origin = null;
  this.stores = schema._stores;
  this.version = schema.getVersion();
  this.onupgradeneeded = schema.callback();

  // assign db property to each store
  Object.keys(this.stores).forEach(function(storeName) {
    this.stores[storeName].db = this;
  }, this);
}

/**
 * Expose core classes.
 */

exports.schema = Schema;
exports.cmp = cmp;
exports.Treo = Treo;
exports.Schema = Schema;
exports.Store = Store;
exports.Index = Index;

/**
 * Use plugin `fn`.
 *
 * @param {Function} fn
 * @return {Treo}
 */

Treo.prototype.use = function(fn) {
  fn(this, exports);
  return this;
};

/**
 * Drop.
 *
 * @param {Function} cb
 */

Treo.prototype.drop = function(cb) {
  var name = this.name;
  this.close(function(err) {
    if (err) return cb(err);
    var req = indexedDB().deleteDatabase(name);
    req.onerror = cb;
    req.onsuccess = function onsuccess() { cb() };
  });
};

/**
 * Close.
 *
 * @param {Function} cb
 */

Treo.prototype.close = function(cb) {
  if (this.status == ''close'') return cb();
  this.getInstance(function(err, db) {
    if (err) return cb(err);
    db.origin = null;
    db.status = ''close'';
    db.close();
    cb();
  });
};

/**
 * Get store by `name`.
 *
 * @param {String} name
 * @return {Store}
 */

Treo.prototype.store = function(name) {
  return this.stores[name];
};

/**
 * Get db instance. It starts opening transaction only once,
 * another requests will be scheduled to queue.
 *
 * @param {Function} cb
 */

Treo.prototype.getInstance = function(cb) {
  if (this.status == ''open'') return cb(null, this.origin);
  if (this.status == ''opening'') return this.queue.push(cb);

  this.status = ''opening'';
  this.queue = [cb]; // queue callbacks

  var that = this;
  var req = indexedDB().open(this.name, this.version);
  req.onupgradeneeded = this.onupgradeneeded;

  req.onerror = req.onblocked = function onerror(e) {
    that.status = ''error'';
    that.queue.forEach(function(cb) { cb(e) });
    delete that.queue;
  };

  req.onsuccess = function onsuccess(e) {
    that.origin = e.target.result;
    that.status = ''open'';
    that.origin.onversionchange = function onversionchange() {
      that.close(function() {});
    };
    that.queue.forEach(function(cb) { cb(null, that.origin) });
    delete that.queue;
  };
};

/**
 * Create new transaction for selected `stores`.
 *
 * @param {String} type (readwrite|readonly)
 * @param {Array} stores - follow indexeddb semantic
 * @param {Function} cb
 */

Treo.prototype.transaction = function(type, stores, cb) {
  this.getInstance(function(err, db) {
    err ? cb(err) : cb(null, db.transaction(stores, type));
  });
};

/**
 * Compare 2 values using IndexedDB comparision algotihm.
 *
 * @param {Mixed} value1
 * @param {Mixed} value2
 * @return {Number} -1|0|1
 */

function cmp() {
  return indexedDB().cmp.apply(indexedDB(), arguments);
}

/**
 * Dynamic link to `global.indexedDB` for polyfills support.
 *
 * @return {IDBDatabase}
 */

function indexedDB() {
  return commonjsGlobal._indexedDB
    || commonjsGlobal.indexedDB
    || commonjsGlobal.msIndexedDB
    || commonjsGlobal.mozIndexedDB
    || commonjsGlobal.webkitIndexedDB;
}
});

var treo = interopDefault(index$38);

var denodeify = createCommonjsModule(function (module) {
''use strict'';

// Copied from: https://github.com/then/promise/blob/master/src/node-extensions.js

// This file contains then/promise specific extensions that are only useful
// for node.js interop

/* Static Functions */

module.exports = function denodeify (fn, argumentCount) {
  if (
    typeof argumentCount === ''number'' && argumentCount !== Infinity
  ) {
    return denodeifyWithCount(fn, argumentCount);
  } else {
    return denodeifyWithoutCount(fn);
  }
};

var callbackFn = (
  ''function (err, res) {'' +
  ''if (err) { rj(err); } else { rs(res); }'' +
  ''}''
);
function denodeifyWithCount(fn, argumentCount) {
  var args = [];
  for (var i = 0; i < argumentCount; i++) {
    args.push(''a'' + i);
  }
  var body = [
    ''return function ('' + args.join('','') + '') {'',
    ''var self = this;'',
    ''return new Promise(function (rs, rj) {'',
    ''var res = fn.call('',
    [''self''].concat(args).concat([callbackFn]).join('',''),
    '');'',
    ''if (res &&'',
    ''(typeof res === "object" || typeof res === "function") &&'',
    ''typeof res.then === "function"'',
    '') {rs(res);}'',
    ''});'',
    ''};''
  ].join('''');
  return Function([''Promise'', ''fn''], body)(Promise, fn);
}
function denodeifyWithoutCount(fn) {
  var fnLength = Math.max(fn.length - 1, 3);
  var args = [];
  for (var i = 0; i < fnLength; i++) {
    args.push(''a'' + i);
  }
  var body = [
    ''return function ('' + args.join('','') + '') {'',
    ''var self = this;'',
    ''var args;'',
    ''var argLength = arguments.length;'',
    ''if (arguments.length > '' + fnLength + '') {'',
    ''args = new Array(arguments.length + 1);'',
    ''for (var i = 0; i < arguments.length; i++) {'',
    ''args[i] = arguments[i];'',
    ''}'',
    ''}'',
    ''return new Promise(function (rs, rj) {'',
    ''var cb = '' + callbackFn + '';'',
    ''var res;'',
    ''switch (argLength) {'',
    args.concat([''extra'']).map(function (_, index) {
      return (
        ''case '' + (index) + '':'' +
        ''res = fn.call('' + [''self''].concat(args.slice(0, index)).concat(''cb'').join('','') + '');'' +
        ''break;''
      );
    }).join(''''),
    ''default:'',
    ''args[argLength] = cb;'',
    ''res = fn.apply(self, args);'',
    ''}'',
    
    ''if (res &&'',
    ''(typeof res === "object" || typeof res === "function") &&'',
    ''typeof res.then === "function"'',
    '') {rs(res);}'',
    ''});'',
    ''};''
  ].join('''');

  return Function(
    [''Promise'', ''fn''],
    body
  )(Promise, fn);
}
});

var denodeify$1 = interopDefault(denodeify);


var require$$0$32 = Object.freeze({
  default: denodeify$1
});

var index$45 = createCommonjsModule(function (module) {
var denodeify = interopDefault(require$$0$32);

/**
 * Expose `plugin()`.
 */

module.exports = plugin;

/**
 * Methods for patch.
 */

var dbMethods = [
  ''drop'',
  ''close''
];

var storeMethods = [
  ''put'',
  ''get'', 
  ''del'',
  ''count'',
  ''clear'',
  ''batch'',
  ''all''
];

var indexMethods = [
  ''get'',
  ''count''
];

/**
 * Denodeify each db''s method and add promises support with
 * https://github.com/jakearchibald/es6-promise
 */

function plugin() {

  return function(db) {
    patch(db, dbMethods);

    Object.keys(db.stores).forEach(function(storeName) {
      var store = db.store(storeName);
      patch(store, storeMethods);

      Object.keys(store.indexes).forEach(function(indexName) {
        var index = store.index(indexName);
        patch(index, indexMethods);
      });
    });
  };
}


/**
 * Patch `methods` from `object` with `denodeify`.
 *
 * @param {Object} object
 * @param {Array} methods
 */

function patch(object, methods) {
  methods.forEach(function(m) {
    // object[m] = promiseWrap(object, m, promiseInstance)
    object[m] = denodeify(object[m])
  });
}
});

var treoPromise = interopDefault(index$45);

var schema$6 = treo.schema()
    .version(1)
        .addStore(''stories'', {key: "id"})

var db$4 = treo(''reader'', schema$6)
    .use(treoPromise())

console.log(''DBV'', db$4.version)

// console.log(''store'', db.store(''stories'').get(''test''))

swBridge.bind("treo.getFromStore", function(opts) {
    if (opts.id) {
        return db$4.store(opts.store).get(opts.id);
    }
    return db$4.store(opts.store)
        .all()
})

swBridge.bind("treo.batchInsert", function(opts) {
    return db$4.store(opts.store)
        .batch(opts.items)
})

swBridge.bind("treo.clearStore", function(opts) {
    return db$4.store(opts.store).clear()
})

swBridge.bind(''reader.checkForNew'', function() {
    return fetch("https://www.gdnmobilelab.com/reader-data/index.json", {mode: ''cors''})
    .then(function (res) { return res.json(); })
    .then(function (data) {
        return swBridge.run(''treo.clearStore'', {
            store: ''stories''
        })
        .then(function () {
            return swBridge.run(''treo.batchInsert'', {
                store: ''stories'',
                items: data
            })
        })
        .then(function () {
            return data;
        })
    })
})

notificationCommands.register(swBridge);
notificationCommands.setConfig(config.notificationCommandsSettings);
setRunFunction(swBridge.run)

self.addEventListener(''install'', function (e) {

    var newCacheKey = ''reader-'' + Date.now()

    e.waitUntil(
        caches.open(newCacheKey)
        .then(function (cache) {
            return cache.addAll([
                ''client.js'',
                ''styles.css'',
                ''gdn.otf''
            ])
        })
        .then(function () { return caches.keys(); })
        .then(function (keys) {
            var eligibleToDelete = keys.filter(function (k) { return k.indexOf(''reader-'') === 0 && k != newCacheKey; })
            return Promise.all(eligibleToDelete.map(function (k) { return caches.delete(k); }))
        })
        .then(function () {
            return swBridge.run(''reader.checkForNew'');
        })
        .then(function () {
            console.log("INSTALL SUCCESSFUL")
            self.skipWaiting()
        })
    )
    
});

self.addEventListener(''activate'', function (e) {
    self.clients.claim()
});

var router = new Router(routes);

self.addEventListener(''fetch'', function (e) {

    if (e.request.url.indexOf("sw.js") > -1) {
        return e.respondWith(fetch(e.request));
    }

    var parsedPath = url$1.parse(e.request.url).path;
   
    var pathRelativeToBase = parsedPath;
    
    if (config.basePath && parsedPath.indexOf(config.basePath) === 0) {
        pathRelativeToBase = parsedPath.substr(config.basePath.length);
    }

    e.respondWith(
        caches.match(e.request)
        .then(function (response) {
            if (response) {
                return response;
            }
            
            throw new Error("No cached response");
        })
        .catch(function (err) {
            // Not cached, so let''s put it through the router
           
            if (e.request.url.indexOf(self.registration.scope) !== 0) {
                throw new NoMatchError("Not in scope")
            }
         
            return router.dispatch(pathRelativeToBase)
            .then(function (component) {
                console.log("hit component")
                var strResponse = "<!DOCTYPE html>" + renderToString(component);

                return new Response(strResponse, {
                    headers: {
                        ''Content-Type'': ''text/html; charset=utf-8''
                    }
                })

            })
        })
        .catch(function (err) {
            if (err instanceof RedirectError) {

                var redirectTo = err.redirectToUrl;
               
                if (config.basePath && redirectTo[0] === ''/'') {
                    redirectTo = config.basePath + redirectTo
                }
               
                return new Response("", {
                    status: err.statusCode,
                    headers: {
                        "Location": redirectTo
                    }
                })
            }
            if (err instanceof NoMatchError == false) {
                console.log(''fail:'', err)
            }
            // If router fails, then we go to network
            return fetch(e.request)
        })
        .catch(function (err) {
            console.error(err)
        })
    )
})', 1, 1481055886, 'https://alastairtest.ngrok.io/reader/', 'https://alastairtest.ngrok.io/reader/sw.js');

insert into "cache" ("cache_id", "contents", "headers", "resource_url", "service_worker_url", "status") values ('reader-1481055887056', X'2f2a2a0a202a20406c6963656e73650a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a0a2f2a2a0a202a204120636f6d706f6e656e742068616e646c657220696e74657266616365207573696e67207468652072657665616c696e67206d6f64756c652064657369676e207061747465726e2e0a202a204d6f72652064657461696c73206f6e20746869732064657369676e207061747465726e20686572653a0a202a2068747470733a2f2f6769746875622e636f6d2f6a61736f6e6d617965732f6d646c2d636f6d706f6e656e742d64657369676e2d7061747465726e0a202a0a202a2040617574686f72204a61736f6e204d617965732e0a202a2f0a2f2a206578706f7274656420636f6d706f6e656e7448616e646c6572202a2f0a0a2f2f205072652d646566696e696e672074686520636f6d706f6e656e7448616e646c657220696e746572666163652c20666f7220636c6f7375726520646f63756d656e746174696f6e20616e640a2f2f2073746174696320766572696669636174696f6e2e0a76617220636f6d706f6e656e7448616e646c65722431203d207b0a20202f2a2a0a2020202a205365617263686573206578697374696e6720444f4d20666f7220656c656d656e7473206f66206f757220636f6d706f6e656e74207479706520616e64207570677261646573207468656d0a2020202a20696620746865792068617665206e6f7420616c7265616479206265656e2075706772616465642e0a2020202a0a2020202a2040706172616d207b737472696e673d7d206f70744a73436c617373207468652070726f6772616d61746963206e616d65206f662074686520656c656d656e7420636c6173732077650a2020202a206e65656420746f206372656174652061206e657720696e7374616e6365206f662e0a2020202a2040706172616d207b737472696e673d7d206f7074437373436c61737320746865206e616d65206f66207468652043535320636c61737320656c656d656e7473206f6620746869730a2020202a20747970652077696c6c20686176652e0a2020202a2f0a202075706772616465446f6d3a2066756e6374696f6e286f70744a73436c6173732c206f7074437373436c61737329207b7d2c0a20202f2a2a0a2020202a205570677261646573206120737065636966696320656c656d656e7420726174686572207468616e20616c6c20696e2074686520444f4d2e0a2020202a0a2020202a2040706172616d207b21456c656d656e747d20656c656d656e742054686520656c656d656e74207765207769736820746f20757067726164652e0a2020202a2040706172616d207b737472696e673d7d206f70744a73436c617373204f7074696f6e616c206e616d65206f662074686520636c6173732077652077616e7420746f20757067726164650a2020202a2074686520656c656d656e7420746f2e0a2020202a2f0a202075706772616465456c656d656e743a2066756e6374696f6e28656c656d656e742c206f70744a73436c61737329207b7d2c0a20202f2a2a0a2020202a2055706772616465732061207370656369666963206c697374206f6620656c656d656e747320726174686572207468616e20616c6c20696e2074686520444f4d2e0a2020202a0a2020202a2040706172616d207b21456c656d656e747c2141727261793c21456c656d656e743e7c214e6f64654c6973747c2148544d4c436f6c6c656374696f6e7d20656c656d656e74730a2020202a2054686520656c656d656e7473207765207769736820746f20757067726164652e0a2020202a2f0a202075706772616465456c656d656e74733a2066756e6374696f6e28656c656d656e747329207b7d2c0a20202f2a2a0a2020202a20557067726164657320616c6c207265676973746572656420636f6d706f6e656e747320666f756e6420696e207468652063757272656e7420444f4d2e20546869732069730a2020202a206175746f6d61746963616c6c792063616c6c6564206f6e2077696e646f77206c6f61642e0a2020202a2f0a202075706772616465416c6c526567697374657265643a2066756e6374696f6e2829207b7d2c0a20202f2a2a0a2020202a20416c6c6f7773207573657220746f20626520616c657274656420746f20616e7920757067726164657320746861742061726520706572666f726d656420666f72206120676976656e0a2020202a20636f6d706f6e656e7420747970650a2020202a0a2020202a2040706172616d207b737472696e677d206a73436c6173732054686520636c617373206e616d65206f6620746865204d444c20636f6d706f6e656e7420776520776973680a2020202a20746f20686f6f6b20696e746f20666f7220616e7920757067726164657320706572666f726d65642e0a2020202a2040706172616d207b66756e6374696f6e282148544d4c456c656d656e74297d2063616c6c6261636b205468652066756e6374696f6e20746f2063616c6c2075706f6e20616e0a2020202a20757067726164652e20546869732066756e6374696f6e2073686f756c6420657870656374203120706172616d65746572202d207468652048544d4c456c656d656e742077686963680a2020202a20676f742075706772616465642e0a2020202a2f0a20207265676973746572557067726164656443616c6c6261636b3a2066756e6374696f6e286a73436c6173732c2063616c6c6261636b29207b7d2c0a20202f2a2a0a2020202a20526567697374657273206120636c61737320666f72206675747572652075736520616e6420617474656d70747320746f2075706772616465206578697374696e6720444f4d2e0a2020202a0a2020202a2040706172616d207b636f6d706f6e656e7448616e646c65722e436f6d706f6e656e74436f6e6669675075626c69637d20636f6e6669672074686520726567697374726174696f6e20636f6e66696775726174696f6e0a2020202a2f0a202072656769737465723a2066756e6374696f6e28636f6e66696729207b7d2c0a20202f2a2a0a2020202a20446f776e677261646520656974686572206120676976656e206e6f64652c20616e206172726179206f66206e6f6465732c206f722061204e6f64654c6973742e0a2020202a0a2020202a2040706172616d207b214e6f64657c2141727261793c214e6f64653e7c214e6f64654c6973747d206e6f6465730a2020202a2f0a2020646f776e6772616465456c656d656e74733a2066756e6374696f6e286e6f64657329207b7d0a7d3b0a0a636f6d706f6e656e7448616e646c65722431203d202866756e6374696f6e2829207b0a20202775736520737472696374273b0a0a20202f2a2a204074797065207b2141727261793c636f6d706f6e656e7448616e646c65722e436f6d706f6e656e74436f6e6669673e7d202a2f0a20207661722072656769737465726564436f6d706f6e656e74735f203d205b5d3b0a0a20202f2a2a204074797065207b2141727261793c636f6d706f6e656e7448616e646c65722e436f6d706f6e656e743e7d202a2f0a20207661722063726561746564436f6d706f6e656e74735f203d205b5d3b0a0a202076617220636f6d706f6e656e74436f6e66696750726f70657274795f203d20276d646c436f6d706f6e656e74436f6e666967496e7465726e616c5f273b0a0a20202f2a2a0a2020202a205365617263686573207265676973746572656420636f6d706f6e656e747320666f72206120636c6173732077652061726520696e746572657374656420696e207573696e672e0a2020202a204f7074696f6e616c6c79207265706c616365732061206d61746368207769746820706173736564206f626a656374206966207370656369666965642e0a2020202a0a2020202a2040706172616d207b737472696e677d206e616d6520546865206e616d65206f66206120636c6173732077652077616e7420746f207573652e0a2020202a2040706172616d207b636f6d706f6e656e7448616e646c65722e436f6d706f6e656e74436f6e6669673d7d206f70745265706c616365204f7074696f6e616c206f626a65637420746f207265706c616365206d6174636820776974682e0a2020202a204072657475726e207b214f626a6563747c626f6f6c65616e7d0a2020202a2040707269766174650a2020202a2f0a202066756e6374696f6e2066696e6452656769737465726564436c6173735f286e616d652c206f70745265706c61636529207b0a20202020666f7220287661722069203d20303b2069203c2072656769737465726564436f6d706f6e656e74735f2e6c656e6774683b20692b2b29207b0a2020202020206966202872656769737465726564436f6d706f6e656e74735f5b695d2e636c6173734e616d65203d3d3d206e616d6529207b0a202020202020202069662028747970656f66206f70745265706c61636520213d3d2027756e646566696e65642729207b0a2020202020202020202072656769737465726564436f6d706f6e656e74735f5b695d203d206f70745265706c6163653b0a20202020202020207d0a202020202020202072657475726e2072656769737465726564436f6d706f6e656e74735f5b695d3b0a2020202020207d0a202020207d0a2020202072657475726e2066616c73653b0a20207d0a0a20202f2a2a0a2020202a2052657475726e7320616e206172726179206f662074686520636c6173734e616d6573206f662074686520757067726164656420636c6173736573206f6e2074686520656c656d656e742e0a2020202a0a2020202a2040706172616d207b21456c656d656e747d20656c656d656e742054686520656c656d656e7420746f20666574636820646174612066726f6d2e0a2020202a204072657475726e207b2141727261793c737472696e673e7d0a2020202a2040707269766174650a2020202a2f0a202066756e6374696f6e2067657455706772616465644c6973744f66456c656d656e745f28656c656d656e7429207b0a2020202076617220646174615570677261646564203d20656c656d656e742e6765744174747269627574652827646174612d757067726164656427293b0a202020202f2f2055736520605b27275d602061732064656661756c742076616c756520746f20636f6e666f726d2074686520602c6e616d652c6e616d652e2e2e60207374796c652e0a2020202072657475726e20646174615570677261646564203d3d3d206e756c6c203f205b27275d203a206461746155706772616465642e73706c697428272c27293b0a20207d0a0a20202f2a2a0a2020202a2052657475726e7320747275652069662074686520676976656e20656c656d656e742068617320616c7265616479206265656e20757067726164656420666f722074686520676976656e0a2020202a20636c6173732e0a2020202a0a2020202a2040706172616d207b21456c656d656e747d20656c656d656e742054686520656c656d656e742077652077616e7420746f20636865636b2e0a2020202a2040706172616d207b737472696e677d206a73436c6173732054686520636c61737320746f20636865636b20666f722e0a2020202a204072657475726e73207b626f6f6c65616e7d0a2020202a2040707269766174650a2020202a2f0a202066756e6374696f6e206973456c656d656e7455706772616465645f28656c656d656e742c206a73436c61737329207b0a202020207661722075706772616465644c697374203d2067657455706772616465644c6973744f66456c656d656e745f28656c656d656e74293b0a2020202072657475726e2075706772616465644c6973742e696e6465784f66286a73436c6173732920213d3d202d313b0a20207d0a0a20202f2a2a0a2020202a205365617263686573206578697374696e6720444f4d20666f7220656c656d656e7473206f66206f757220636f6d706f6e656e74207479706520616e64207570677261646573207468656d0a2020202a20696620746865792068617665206e6f7420616c7265616479206265656e2075706772616465642e0a2020202a0a2020202a2040706172616d207b737472696e673d7d206f70744a73436c617373207468652070726f6772616d61746963206e616d65206f662074686520656c656d656e7420636c6173732077650a2020202a206e65656420746f206372656174652061206e657720696e7374616e6365206f662e0a2020202a2040706172616d207b737472696e673d7d206f7074437373436c61737320746865206e616d65206f66207468652043535320636c61737320656c656d656e7473206f6620746869730a2020202a20747970652077696c6c20686176652e0a2020202a2f0a202066756e6374696f6e2075706772616465446f6d496e7465726e616c286f70744a73436c6173732c206f7074437373436c61737329207b0a2020202069662028747970656f66206f70744a73436c617373203d3d3d2027756e646566696e6564272026260a2020202020202020747970656f66206f7074437373436c617373203d3d3d2027756e646566696e65642729207b0a202020202020666f7220287661722069203d20303b2069203c2072656769737465726564436f6d706f6e656e74735f2e6c656e6774683b20692b2b29207b0a202020202020202075706772616465446f6d496e7465726e616c2872656769737465726564436f6d706f6e656e74735f5b695d2e636c6173734e616d652c0a20202020202020202020202072656769737465726564436f6d706f6e656e74735f5b695d2e637373436c617373293b0a2020202020207d0a202020207d20656c7365207b0a202020202020766172206a73436c617373203d202f2a2a204074797065207b737472696e677d202a2f20286f70744a73436c617373293b0a20202020202069662028747970656f66206f7074437373436c617373203d3d3d2027756e646566696e65642729207b0a20202020202020207661722072656769737465726564436c617373203d2066696e6452656769737465726564436c6173735f286a73436c617373293b0a20202020202020206966202872656769737465726564436c61737329207b0a202020202020202020206f7074437373436c617373203d2072656769737465726564436c6173732e637373436c6173733b0a20202020202020207d0a2020202020207d0a0a20202020202076617220656c656d656e7473203d20646f63756d656e742e717565727953656c6563746f72416c6c28272e27202b206f7074437373436c617373293b0a202020202020666f722028766172206e203d20303b206e203c20656c656d656e74732e6c656e6774683b206e2b2b29207b0a202020202020202075706772616465456c656d656e74496e7465726e616c28656c656d656e74735b6e5d2c206a73436c617373293b0a2020202020207d0a202020207d0a20207d0a0a20202f2a2a0a2020202a205570677261646573206120737065636966696320656c656d656e7420726174686572207468616e20616c6c20696e2074686520444f4d2e0a2020202a0a2020202a2040706172616d207b21456c656d656e747d20656c656d656e742054686520656c656d656e74207765207769736820746f20757067726164652e0a2020202a2040706172616d207b737472696e673d7d206f70744a73436c617373204f7074696f6e616c206e616d65206f662074686520636c6173732077652077616e7420746f20757067726164650a2020202a2074686520656c656d656e7420746f2e0a2020202a2f0a202066756e6374696f6e2075706772616465456c656d656e74496e7465726e616c28656c656d656e742c206f70744a73436c61737329207b0a202020202f2f2056657269667920617267756d656e7420747970652e0a20202020696620282128747970656f6620656c656d656e74203d3d3d20276f626a6563742720262620656c656d656e7420696e7374616e63656f6620456c656d656e742929207b0a2020202020207468726f77206e6577204572726f722827496e76616c696420617267756d656e742070726f766964656420746f2075706772616465204d444c20656c656d656e742e27293b0a202020207d0a202020207661722075706772616465644c697374203d2067657455706772616465644c6973744f66456c656d656e745f28656c656d656e74293b0a2020202076617220636c6173736573546f55706772616465203d205b5d3b0a202020202f2f204966206a73436c617373206973206e6f742070726f7669646564207363616e20746865207265676973746572656420636f6d706f6e656e747320746f2066696e64207468650a202020202f2f206f6e6573206d61746368696e672074686520656c656d656e7427732043535320636c6173734c6973742e0a2020202069662028216f70744a73436c61737329207b0a20202020202076617220636c6173734c697374203d20656c656d656e742e636c6173734c6973743b0a20202020202072656769737465726564436f6d706f6e656e74735f2e666f72456163682866756e6374696f6e28636f6d706f6e656e7429207b0a20202020202020202f2f204d61746368204353532026204e6f7420746f2062652075706772616465642026204e6f742075706772616465642e0a202020202020202069662028636c6173734c6973742e636f6e7461696e7328636f6d706f6e656e742e637373436c617373292026260a202020202020202020202020636c6173736573546f557067726164652e696e6465784f6628636f6d706f6e656e7429203d3d3d202d312026260a202020202020202020202020216973456c656d656e7455706772616465645f28656c656d656e742c20636f6d706f6e656e742e636c6173734e616d652929207b0a20202020202020202020636c6173736573546f557067726164652e7075736828636f6d706f6e656e74293b0a20202020202020207d0a2020202020207d293b0a202020207d20656c73652069662028216973456c656d656e7455706772616465645f28656c656d656e742c206f70744a73436c6173732929207b0a202020202020636c6173736573546f557067726164652e707573682866696e6452656769737465726564436c6173735f286f70744a73436c61737329293b0a202020207d0a0a202020202f2f20557067726164652074686520656c656d656e7420666f72206561636820636c61737365732e0a20202020666f7220287661722069203d20302c206e203d20636c6173736573546f557067726164652e6c656e6774682c2072656769737465726564436c6173733b2069203c206e3b20692b2b29207b0a20202020202072656769737465726564436c617373203d20636c6173736573546f557067726164655b695d3b0a2020202020206966202872656769737465726564436c61737329207b0a20202020202020202f2f204d61726b20656c656d656e742061732075706772616465642e0a202020202020202075706772616465644c6973742e707573682872656769737465726564436c6173732e636c6173734e616d65293b0a2020202020202020656c656d656e742e7365744174747269627574652827646174612d7570677261646564272c2075706772616465644c6973742e6a6f696e28272c2729293b0a202020202020202076617220696e7374616e6365203d206e65772072656769737465726564436c6173732e636c617373436f6e7374727563746f7228656c656d656e74293b0a2020202020202020696e7374616e63655b636f6d706f6e656e74436f6e66696750726f70657274795f5d203d2072656769737465726564436c6173733b0a202020202020202063726561746564436f6d706f6e656e74735f2e7075736828696e7374616e6365293b0a20202020202020202f2f2043616c6c20616e792063616c6c6261636b732074686520757365722068617320726567697374657265642077697468207468697320636f6d706f6e656e7420747970652e0a2020202020202020666f722028766172206a203d20302c206d203d2072656769737465726564436c6173732e63616c6c6261636b732e6c656e6774683b206a203c206d3b206a2b2b29207b0a2020202020202020202072656769737465726564436c6173732e63616c6c6261636b735b6a5d28656c656d656e74293b0a20202020202020207d0a0a20202020202020206966202872656769737465726564436c6173732e77696467657429207b0a202020202020202020202f2f2041737369676e2070657220656c656d656e7420696e7374616e636520666f7220636f6e74726f6c206f766572204150490a20202020202020202020656c656d656e745b72656769737465726564436c6173732e636c6173734e616d655d203d20696e7374616e63653b0a20202020202020207d0a2020202020207d20656c7365207b0a20202020202020207468726f77206e6577204572726f72280a2020202020202020202027556e61626c6520746f2066696e642061207265676973746572656420636f6d706f6e656e7420666f722074686520676976656e20636c6173732e27293b0a2020202020207d0a0a2020202020207661722065763b0a2020202020206966202827437573746f6d4576656e742720696e2077696e646f7720262620747970656f662077696e646f772e437573746f6d4576656e74203d3d3d202766756e6374696f6e2729207b0a20202020202020206576203d206e657720437573746f6d4576656e7428276d646c2d636f6d706f6e656e747570677261646564272c207b0a20202020202020202020627562626c65733a20747275652c2063616e63656c61626c653a2066616c73650a20202020202020207d293b0a2020202020207d20656c7365207b0a20202020202020206576203d20646f63756d656e742e6372656174654576656e7428274576656e747327293b0a202020202020202065762e696e69744576656e7428276d646c2d636f6d706f6e656e747570677261646564272c20747275652c2074727565293b0a2020202020207d0a202020202020656c656d656e742e64697370617463684576656e74286576293b0a202020207d0a20207d0a0a20202f2a2a0a2020202a2055706772616465732061207370656369666963206c697374206f6620656c656d656e747320726174686572207468616e20616c6c20696e2074686520444f4d2e0a2020202a0a2020202a2040706172616d207b21456c656d656e747c2141727261793c21456c656d656e743e7c214e6f64654c6973747c2148544d4c436f6c6c656374696f6e7d20656c656d656e74730a2020202a2054686520656c656d656e7473207765207769736820746f20757067726164652e0a2020202a2f0a202066756e6374696f6e2075706772616465456c656d656e7473496e7465726e616c28656c656d656e747329207b0a20202020696620282141727261792e6973417272617928656c656d656e74732929207b0a20202020202069662028656c656d656e747320696e7374616e63656f6620456c656d656e7429207b0a2020202020202020656c656d656e7473203d205b656c656d656e74735d3b0a2020202020207d20656c7365207b0a2020202020202020656c656d656e7473203d2041727261792e70726f746f747970652e736c6963652e63616c6c28656c656d656e7473293b0a2020202020207d0a202020207d0a20202020666f7220287661722069203d20302c206e203d20656c656d656e74732e6c656e6774682c20656c656d656e743b2069203c206e3b20692b2b29207b0a202020202020656c656d656e74203d20656c656d656e74735b695d3b0a20202020202069662028656c656d656e7420696e7374616e63656f662048544d4c456c656d656e7429207b0a202020202020202075706772616465456c656d656e74496e7465726e616c28656c656d656e74293b0a202020202020202069662028656c656d656e742e6368696c6472656e2e6c656e677468203e203029207b0a2020202020202020202075706772616465456c656d656e7473496e7465726e616c28656c656d656e742e6368696c6472656e293b0a20202020202020207d0a2020202020207d0a202020207d0a20207d0a0a20202f2a2a0a2020202a20526567697374657273206120636c61737320666f72206675747572652075736520616e6420617474656d70747320746f2075706772616465206578697374696e6720444f4d2e0a2020202a0a2020202a2040706172616d207b636f6d706f6e656e7448616e646c65722e436f6d706f6e656e74436f6e6669675075626c69637d20636f6e6669670a2020202a2f0a202066756e6374696f6e207265676973746572496e7465726e616c28636f6e66696729207b0a202020202f2f20496e206f7264657220746f20737570706f727420626f746820436c6f737572652d636f6d70696c656420616e6420756e636f6d70696c656420636f646520616363657373696e670a202020202f2f2074686973206d6574686f642c207765206e65656420746f20616c6c6f7720666f7220626f74682074686520646f7420616e642061727261792073796e74617820666f720a202020202f2f2070726f7065727479206163636573732e20596f75276c6c207468657265666f726520736565207468652060666f6f2e626172207c7c20666f6f5b27626172275d600a202020202f2f207061747465726e207265706561746564206163726f73732074686973206d6574686f642e0a20202020766172207769646765744d697373696e67203d2028747970656f6620636f6e6669672e776964676574203d3d3d2027756e646566696e6564272026260a2020202020202020747970656f6620636f6e6669675b27776964676574275d203d3d3d2027756e646566696e656427293b0a2020202076617220776964676574203d20747275653b0a0a2020202069662028217769646765744d697373696e6729207b0a202020202020776964676574203d20636f6e6669672e776964676574207c7c20636f6e6669675b27776964676574275d3b0a202020207d0a0a20202020766172206e6577436f6e666967203d202f2a2a204074797065207b636f6d706f6e656e7448616e646c65722e436f6d706f6e656e74436f6e6669677d202a2f20287b0a202020202020636c617373436f6e7374727563746f723a20636f6e6669672e636f6e7374727563746f72207c7c20636f6e6669675b27636f6e7374727563746f72275d2c0a202020202020636c6173734e616d653a20636f6e6669672e636c6173734173537472696e67207c7c20636f6e6669675b27636c6173734173537472696e67275d2c0a202020202020637373436c6173733a20636f6e6669672e637373436c617373207c7c20636f6e6669675b27637373436c617373275d2c0a2020202020207769646765743a207769646765742c0a20202020202063616c6c6261636b733a205b5d0a202020207d293b0a0a2020202072656769737465726564436f6d706f6e656e74735f2e666f72456163682866756e6374696f6e286974656d29207b0a202020202020696620286974656d2e637373436c617373203d3d3d206e6577436f6e6669672e637373436c61737329207b0a20202020202020207468726f77206e6577204572726f7228275468652070726f766964656420637373436c6173732068617320616c7265616479206265656e20726567697374657265643a2027202b206974656d2e637373436c617373293b0a2020202020207d0a202020202020696620286974656d2e636c6173734e616d65203d3d3d206e6577436f6e6669672e636c6173734e616d6529207b0a20202020202020207468726f77206e6577204572726f7228275468652070726f766964656420636c6173734e616d652068617320616c7265616479206265656e207265676973746572656427293b0a2020202020207d0a202020207d293b0a0a2020202069662028636f6e6669672e636f6e7374727563746f722e70726f746f747970650a20202020202020202e6861734f776e50726f706572747928636f6d706f6e656e74436f6e66696750726f70657274795f2929207b0a2020202020207468726f77206e6577204572726f72280a20202020202020202020274d444c20636f6d706f6e656e7420636c6173736573206d757374206e6f7420686176652027202b20636f6d706f6e656e74436f6e66696750726f70657274795f202b0a202020202020202020202720646566696e656420617320612070726f70657274792e27293b0a202020207d0a0a2020202076617220666f756e64203d2066696e6452656769737465726564436c6173735f28636f6e6669672e636c6173734173537472696e672c206e6577436f6e666967293b0a0a202020206966202821666f756e6429207b0a20202020202072656769737465726564436f6d706f6e656e74735f2e70757368286e6577436f6e666967293b0a202020207d0a20207d0a0a20202f2a2a0a2020202a20416c6c6f7773207573657220746f20626520616c657274656420746f20616e7920757067726164657320746861742061726520706572666f726d656420666f72206120676976656e0a2020202a20636f6d706f6e656e7420747970650a2020202a0a2020202a2040706172616d207b737472696e677d206a73436c6173732054686520636c617373206e616d65206f6620746865204d444c20636f6d706f6e656e7420776520776973680a2020202a20746f20686f6f6b20696e746f20666f7220616e7920757067726164657320706572666f726d65642e0a2020202a2040706172616d207b66756e6374696f6e282148544d4c456c656d656e74297d2063616c6c6261636b205468652066756e6374696f6e20746f2063616c6c2075706f6e20616e0a2020202a20757067726164652e20546869732066756e6374696f6e2073686f756c6420657870656374203120706172616d65746572202d207468652048544d4c456c656d656e742077686963680a2020202a20676f742075706772616465642e0a2020202a2f0a202066756e6374696f6e207265676973746572557067726164656443616c6c6261636b496e7465726e616c286a73436c6173732c2063616c6c6261636b29207b0a2020202076617220726567436c617373203d2066696e6452656769737465726564436c6173735f286a73436c617373293b0a2020202069662028726567436c61737329207b0a202020202020726567436c6173732e63616c6c6261636b732e707573682863616c6c6261636b293b0a202020207d0a20207d0a0a20202f2a2a0a2020202a20557067726164657320616c6c207265676973746572656420636f6d706f6e656e747320666f756e6420696e207468652063757272656e7420444f4d2e20546869732069730a2020202a206175746f6d61746963616c6c792063616c6c6564206f6e2077696e646f77206c6f61642e0a2020202a2f0a202066756e6374696f6e2075706772616465416c6c52656769737465726564496e7465726e616c2829207b0a20202020666f722028766172206e203d20303b206e203c2072656769737465726564436f6d706f6e656e74735f2e6c656e6774683b206e2b2b29207b0a20202020202075706772616465446f6d496e7465726e616c2872656769737465726564436f6d706f6e656e74735f5b6e5d2e636c6173734e616d65293b0a202020207d0a20207d0a0a20202f2a2a0a2020202a20436865636b2074686520636f6d706f6e656e7420666f722074686520646f776e6772616465206d6574686f642e0a2020202a204578656375746520696620666f756e642e0a2020202a2052656d6f766520636f6d706f6e656e742066726f6d2063726561746564436f6d706f6e656e7473206c6973742e0a2020202a0a2020202a2040706172616d207b3f636f6d706f6e656e7448616e646c65722e436f6d706f6e656e747d20636f6d706f6e656e740a2020202a2f0a202066756e6374696f6e206465636f6e737472756374436f6d706f6e656e74496e7465726e616c28636f6d706f6e656e7429207b0a2020202069662028636f6d706f6e656e7429207b0a20202020202076617220636f6d706f6e656e74496e646578203d2063726561746564436f6d706f6e656e74735f2e696e6465784f6628636f6d706f6e656e74293b0a20202020202063726561746564436f6d706f6e656e74735f2e73706c69636528636f6d706f6e656e74496e6465782c2031293b0a0a202020202020766172207570677261646573203d20636f6d706f6e656e742e656c656d656e745f2e6765744174747269627574652827646174612d757067726164656427292e73706c697428272c27293b0a20202020202076617220636f6d706f6e656e74506c616365203d2075706772616465732e696e6465784f6628636f6d706f6e656e745b636f6d706f6e656e74436f6e66696750726f70657274795f5d2e636c6173734173537472696e67293b0a20202020202075706772616465732e73706c69636528636f6d706f6e656e74506c6163652c2031293b0a202020202020636f6d706f6e656e742e656c656d656e745f2e7365744174747269627574652827646174612d7570677261646564272c2075706772616465732e6a6f696e28272c2729293b0a0a2020202020207661722065763b0a2020202020206966202827437573746f6d4576656e742720696e2077696e646f7720262620747970656f662077696e646f772e437573746f6d4576656e74203d3d3d202766756e6374696f6e2729207b0a20202020202020206576203d206e657720437573746f6d4576656e7428276d646c2d636f6d706f6e656e74646f776e677261646564272c207b0a20202020202020202020627562626c65733a20747275652c2063616e63656c61626c653a2066616c73650a20202020202020207d293b0a2020202020207d20656c7365207b0a20202020202020206576203d20646f63756d656e742e6372656174654576656e7428274576656e747327293b0a202020202020202065762e696e69744576656e7428276d646c2d636f6d706f6e656e74646f776e677261646564272c20747275652c2074727565293b0a2020202020207d0a202020202020636f6d706f6e656e742e656c656d656e745f2e64697370617463684576656e74286576293b0a202020207d0a20207d0a0a20202f2a2a0a2020202a20446f776e677261646520656974686572206120676976656e206e6f64652c20616e206172726179206f66206e6f6465732c206f722061204e6f64654c6973742e0a2020202a0a2020202a2040706172616d207b214e6f64657c2141727261793c214e6f64653e7c214e6f64654c6973747d206e6f6465730a2020202a2f0a202066756e6374696f6e20646f776e67726164654e6f646573496e7465726e616c286e6f64657329207b0a202020202f2a2a0a20202020202a20417578696c696172792066756e6374696f6e20746f20646f776e677261646520612073696e676c65206e6f64652e0a20202020202a2040706172616d20207b214e6f64657d206e6f646520746865206e6f646520746f20626520646f776e6772616465640a20202020202a2f0a2020202076617220646f776e67726164654e6f6465203d2066756e6374696f6e286e6f646529207b0a20202020202063726561746564436f6d706f6e656e74735f2e66696c7465722866756e6374696f6e286974656d29207b0a202020202020202072657475726e206974656d2e656c656d656e745f203d3d3d206e6f64653b0a2020202020207d292e666f7245616368286465636f6e737472756374436f6d706f6e656e74496e7465726e616c293b0a202020207d3b0a20202020696620286e6f64657320696e7374616e63656f66204172726179207c7c206e6f64657320696e7374616e63656f66204e6f64654c69737429207b0a202020202020666f722028766172206e203d20303b206e203c206e6f6465732e6c656e6774683b206e2b2b29207b0a2020202020202020646f776e67726164654e6f6465286e6f6465735b6e5d293b0a2020202020207d0a202020207d20656c736520696620286e6f64657320696e7374616e63656f66204e6f646529207b0a202020202020646f776e67726164654e6f6465286e6f646573293b0a202020207d20656c7365207b0a2020202020207468726f77206e6577204572726f722827496e76616c696420617267756d656e742070726f766964656420746f20646f776e6772616465204d444c206e6f6465732e27293b0a202020207d0a20207d0a0a20202f2f204e6f772072657475726e207468652066756e6374696f6e7320746861742073686f756c64206265206d616465207075626c69632077697468207468656972207075626c69636c790a20202f2f20666163696e67206e616d65732e2e2e0a202072657475726e207b0a2020202075706772616465446f6d3a2075706772616465446f6d496e7465726e616c2c0a2020202075706772616465456c656d656e743a2075706772616465456c656d656e74496e7465726e616c2c0a2020202075706772616465456c656d656e74733a2075706772616465456c656d656e7473496e7465726e616c2c0a2020202075706772616465416c6c526567697374657265643a2075706772616465416c6c52656769737465726564496e7465726e616c2c0a202020207265676973746572557067726164656443616c6c6261636b3a207265676973746572557067726164656443616c6c6261636b496e7465726e616c2c0a2020202072656769737465723a207265676973746572496e7465726e616c2c0a20202020646f776e6772616465456c656d656e74733a20646f776e67726164654e6f646573496e7465726e616c0a20207d3b0a7d2928293b0a0a2f2f206a7368696e742069676e6f72653a6c696e650a0a2f2f204578706f727420616c6c2073796d626f6c732c20666f72207468652062656e65666974206f6620436c6f7375726520636f6d70696c65722e0a2f2f204e6f20656666656374206f6e20756e636f6d70696c656420636f64652e0a636f6d706f6e656e7448616e646c657224315b2775706772616465446f6d275d203d20636f6d706f6e656e7448616e646c657224312e75706772616465446f6d3b0a636f6d706f6e656e7448616e646c657224315b2775706772616465456c656d656e74275d203d20636f6d706f6e656e7448616e646c657224312e75706772616465456c656d656e743b0a636f6d706f6e656e7448616e646c657224315b2775706772616465456c656d656e7473275d203d20636f6d706f6e656e7448616e646c657224312e75706772616465456c656d656e74733b0a636f6d706f6e656e7448616e646c657224315b2775706772616465416c6c52656769737465726564275d203d0a20202020636f6d706f6e656e7448616e646c657224312e75706772616465416c6c526567697374657265643b0a636f6d706f6e656e7448616e646c657224315b277265676973746572557067726164656443616c6c6261636b275d203d0a20202020636f6d706f6e656e7448616e646c657224312e7265676973746572557067726164656443616c6c6261636b3b0a636f6d706f6e656e7448616e646c657224315b277265676973746572275d203d20636f6d706f6e656e7448616e646c657224312e72656769737465723b0a636f6d706f6e656e7448616e646c657224315b27646f776e6772616465456c656d656e7473275d203d20636f6d706f6e656e7448616e646c657224312e646f776e6772616465456c656d656e74733b0a77696e646f772e636f6d706f6e656e7448616e646c6572203d20636f6d706f6e656e7448616e646c657224313b0a77696e646f775b27636f6d706f6e656e7448616e646c6572275d203d20636f6d706f6e656e7448616e646c657224313b0a0a77696e646f772e6164644576656e744c697374656e657228276c6f6164272c2066756e6374696f6e2829207b0a20202775736520737472696374273b0a0a20202f2a2a0a2020202a20506572666f726d732061202243757474696e6720746865206d7573746172642220746573742e204966207468652062726f7773657220737570706f727473207468652066656174757265730a2020202a207465737465642c20616464732061206d646c2d6a7320636c61737320746f20746865203c68746d6c3e20656c656d656e742e204974207468656e20757067726164657320616c6c204d444c0a2020202a20636f6d706f6e656e747320726571756972696e67204a6176615363726970742e0a2020202a2f0a20206966202827636c6173734c6973742720696e20646f63756d656e742e637265617465456c656d656e74282764697627292026260a20202020202027717565727953656c6563746f722720696e20646f63756d656e742026260a202020202020276164644576656e744c697374656e65722720696e2077696e646f772026262041727261792e70726f746f747970652e666f724561636829207b0a20202020646f63756d656e742e646f63756d656e74456c656d656e742e636c6173734c6973742e61646428276d646c2d6a7327293b0a20202020636f6d706f6e656e7448616e646c657224312e75706772616465416c6c5265676973746572656428293b0a20207d20656c7365207b0a202020202f2a2a0a20202020202a2044756d6d792066756e6374696f6e20746f2061766f6964204a53206572726f72732e0a20202020202a2f0a20202020636f6d706f6e656e7448616e646c657224312e75706772616465456c656d656e74203d2066756e6374696f6e2829207b7d3b0a202020202f2a2a0a20202020202a2044756d6d792066756e6374696f6e20746f2061766f6964204a53206572726f72732e0a20202020202a2f0a20202020636f6d706f6e656e7448616e646c657224312e7265676973746572203d2066756e6374696f6e2829207b7d3b0a20207d0a7d293b0a0a2f2a2a0a202a20406c6963656e73650a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a0a2866756e6374696f6e2829207b0a20202775736520737472696374273b0a0a20202f2a2a0a2020202a20436c61737320636f6e7374727563746f7220666f7220427574746f6e204d444c20636f6d706f6e656e742e0a2020202a20496d706c656d656e7473204d444c20636f6d706f6e656e742064657369676e207061747465726e20646566696e65642061743a0a2020202a2068747470733a2f2f6769746875622e636f6d2f6a61736f6e6d617965732f6d646c2d636f6d706f6e656e742d64657369676e2d7061747465726e0a2020202a0a2020202a2040706172616d207b48544d4c456c656d656e747d20656c656d656e742054686520656c656d656e7420746861742077696c6c2062652075706772616465642e0a2020202a2f0a2020766172204d6174657269616c427574746f6e203d2066756e6374696f6e204d6174657269616c427574746f6e28656c656d656e7429207b0a20202020746869732e656c656d656e745f203d20656c656d656e743b0a0a202020202f2f20496e697469616c697a6520696e7374616e63652e0a20202020746869732e696e697428293b0a20207d3b0a202077696e646f775b274d6174657269616c427574746f6e275d203d204d6174657269616c427574746f6e3b0a0a20202f2a2a0a2020202a2053746f726520636f6e7374616e747320696e206f6e6520706c61636520736f20746865792063616e206265207570646174656420656173696c792e0a2020202a0a2020202a2040656e756d207b737472696e67207c206e756d6265727d0a2020202a2040707269766174650a2020202a2f0a20204d6174657269616c427574746f6e2e70726f746f747970652e436f6e7374616e745f203d207b0a202020202f2f204e6f6e6520666f72206e6f772e0a20207d3b0a0a20202f2a2a0a2020202a2053746f726520737472696e677320666f7220636c617373206e616d657320646566696e6564206279207468697320636f6d706f6e656e74207468617420617265207573656420696e0a2020202a204a6176615363726970742e205468697320616c6c6f777320757320746f2073696d706c79206368616e676520697420696e206f6e6520706c6163652073686f756c642077650a2020202a2064656369646520746f206d6f646966792061742061206c6174657220646174652e0a2020202a0a2020202a2040656e756d207b737472696e677d0a2020202a2040707269766174650a2020202a2f0a20204d6174657269616c427574746f6e2e70726f746f747970652e437373436c61737365735f203d207b0a20202020524950504c455f4546464543543a20276d646c2d6a732d726970706c652d656666656374272c0a20202020524950504c455f434f4e5441494e45523a20276d646c2d627574746f6e5f5f726970706c652d636f6e7461696e6572272c0a20202020524950504c453a20276d646c2d726970706c65270a20207d3b0a0a20202f2a2a0a2020202a2048616e646c6520626c7572206f6620656c656d656e742e0a2020202a0a2020202a2040706172616d207b4576656e747d206576656e7420546865206576656e7420746861742066697265642e0a2020202a2040707269766174650a2020202a2f0a20204d6174657269616c427574746f6e2e70726f746f747970652e626c757248616e646c65725f203d2066756e6374696f6e286576656e7429207b0a20202020696620286576656e7429207b0a202020202020746869732e656c656d656e745f2e626c757228293b0a202020207d0a20207d3b0a0a20202f2f205075626c6963206d6574686f64732e0a0a20202f2a2a0a2020202a2044697361626c6520627574746f6e2e0a2020202a0a2020202a20407075626c69630a2020202a2f0a20204d6174657269616c427574746f6e2e70726f746f747970652e64697361626c65203d2066756e6374696f6e2829207b0a20202020746869732e656c656d656e745f2e64697361626c6564203d20747275653b0a20207d3b0a20204d6174657269616c427574746f6e2e70726f746f747970655b2764697361626c65275d203d204d6174657269616c427574746f6e2e70726f746f747970652e64697361626c653b0a0a20202f2a2a0a2020202a20456e61626c6520627574746f6e2e0a2020202a0a2020202a20407075626c69630a2020202a2f0a20204d6174657269616c427574746f6e2e70726f746f747970652e656e61626c65203d2066756e6374696f6e2829207b0a20202020746869732e656c656d656e745f2e64697361626c6564203d2066616c73653b0a20207d3b0a20204d6174657269616c427574746f6e2e70726f746f747970655b27656e61626c65275d203d204d6174657269616c427574746f6e2e70726f746f747970652e656e61626c653b0a0a20202f2a2a0a2020202a20496e697469616c697a6520656c656d656e742e0a2020202a2f0a20204d6174657269616c427574746f6e2e70726f746f747970652e696e6974203d2066756e6374696f6e2829207b0a2020202069662028746869732e656c656d656e745f29207b0a20202020202069662028746869732e656c656d656e745f2e636c6173734c6973742e636f6e7461696e7328746869732e437373436c61737365735f2e524950504c455f4546464543542929207b0a202020202020202076617220726970706c65436f6e7461696e6572203d20646f63756d656e742e637265617465456c656d656e7428277370616e27293b0a2020202020202020726970706c65436f6e7461696e65722e636c6173734c6973742e61646428746869732e437373436c61737365735f2e524950504c455f434f4e5441494e4552293b0a2020202020202020746869732e726970706c65456c656d656e745f203d20646f63756d656e742e637265617465456c656d656e7428277370616e27293b0a2020202020202020746869732e726970706c65456c656d656e745f2e636c6173734c6973742e61646428746869732e437373436c61737365735f2e524950504c45293b0a2020202020202020726970706c65436f6e7461696e65722e617070656e644368696c6428746869732e726970706c65456c656d656e745f293b0a2020202020202020746869732e626f756e64526970706c65426c757248616e646c6572203d20746869732e626c757248616e646c65725f2e62696e642874686973293b0a2020202020202020746869732e726970706c65456c656d656e745f2e6164644576656e744c697374656e657228276d6f7573657570272c20746869732e626f756e64526970706c65426c757248616e646c6572293b0a2020202020202020746869732e656c656d656e745f2e617070656e644368696c6428726970706c65436f6e7461696e6572293b0a2020202020207d0a202020202020746869732e626f756e64427574746f6e426c757248616e646c6572203d20746869732e626c757248616e646c65725f2e62696e642874686973293b0a202020202020746869732e656c656d656e745f2e6164644576656e744c697374656e657228276d6f7573657570272c20746869732e626f756e64427574746f6e426c757248616e646c6572293b0a202020202020746869732e656c656d656e745f2e6164644576656e744c697374656e657228276d6f7573656c65617665272c20746869732e626f756e64427574746f6e426c757248616e646c6572293b0a202020207d0a20207d3b0a0a20202f2f2054686520636f6d706f6e656e742072656769737465727320697473656c662e2049742063616e20617373756d6520636f6d706f6e656e7448616e646c657220697320617661696c61626c650a20202f2f20696e2074686520676c6f62616c2073636f70652e0a2020636f6d706f6e656e7448616e646c65722e7265676973746572287b0a20202020636f6e7374727563746f723a204d6174657269616c427574746f6e2c0a20202020636c6173734173537472696e673a20274d6174657269616c427574746f6e272c0a20202020637373436c6173733a20276d646c2d6a732d627574746f6e272c0a202020207769646765743a20747275650a20207d293b0a7d2928293b0a0a76617220636f6d6d6f6e6a73476c6f62616c203d20747970656f662077696e646f7720213d3d2027756e646566696e656427203f2077696e646f77203a20747970656f6620676c6f62616c20213d3d2027756e646566696e656427203f20676c6f62616c203a20747970656f662073656c6620213d3d2027756e646566696e656427203f2073656c66203a207b7d0a0a66756e6374696f6e20696e7465726f7044656661756c7428657829207b0a0972657475726e20657820262620747970656f66206578203d3d3d20276f626a65637427202626202764656661756c742720696e206578203f2065785b2764656661756c74275d203a2065783b0a7d0a0a66756e6374696f6e20637265617465436f6d6d6f6e6a734d6f64756c6528666e2c206d6f64756c6529207b0a0972657475726e206d6f64756c65203d207b206578706f7274733a207b7d207d2c20666e286d6f64756c652c206d6f64756c652e6578706f727473292c206d6f64756c652e6578706f7274733b0a7d0a0a76617220636f6d70696c65644772616d6d6172203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c652c206578706f72747329207b0a2f2a207061727365722067656e657261746564206279206a69736f6e20302e342e3137202a2f0a2f2a0a202052657475726e73206120506172736572206f626a656374206f662074686520666f6c6c6f77696e67207374727563747572653a0a0a20205061727365723a207b0a2020202079793a207b7d0a20207d0a0a20205061727365722e70726f746f747970653a207b0a2020202079793a207b7d2c0a2020202074726163653a2066756e6374696f6e28292c0a2020202073796d626f6c735f3a207b6173736f63696174697665206c6973743a206e616d65203d3d3e206e756d6265727d2c0a202020207465726d696e616c735f3a207b6173736f63696174697665206c6973743a206e756d626572203d3d3e206e616d657d2c0a2020202070726f64756374696f6e735f3a205b2e2e2e5d2c0a20202020706572666f726d416374696f6e3a2066756e6374696f6e20616e6f6e796d6f7573287979746578742c2079796c656e672c2079796c696e656e6f2c2079792c20797973746174652c2024242c205f24292c0a202020207461626c653a205b2e2e2e5d2c0a2020202064656661756c74416374696f6e733a207b2e2e2e7d2c0a2020202070617273654572726f723a2066756e6374696f6e287374722c2068617368292c0a2020202070617273653a2066756e6374696f6e28696e707574292c0a0a202020206c657865723a207b0a2020202020202020454f463a20312c0a202020202020202070617273654572726f723a2066756e6374696f6e287374722c2068617368292c0a2020202020202020736574496e7075743a2066756e6374696f6e28696e707574292c0a2020202020202020696e7075743a2066756e6374696f6e28292c0a2020202020202020756e7075743a2066756e6374696f6e28737472292c0a20202020202020206d6f72653a2066756e6374696f6e28292c0a20202020202020206c6573733a2066756e6374696f6e286e292c0a202020202020202070617374496e7075743a2066756e6374696f6e28292c0a20202020202020207570636f6d696e67496e7075743a2066756e6374696f6e28292c0a202020202020202073686f77506f736974696f6e3a2066756e6374696f6e28292c0a2020202020202020746573745f6d617463683a2066756e6374696f6e2872656765785f6d617463685f61727261792c2072756c655f696e646578292c0a20202020202020206e6578743a2066756e6374696f6e28292c0a20202020202020206c65783a2066756e6374696f6e28292c0a2020202020202020626567696e3a2066756e6374696f6e28636f6e646974696f6e292c0a2020202020202020706f7053746174653a2066756e6374696f6e28292c0a20202020202020205f63757272656e7452756c65733a2066756e6374696f6e28292c0a2020202020202020746f7053746174653a2066756e6374696f6e28292c0a20202020202020207075736853746174653a2066756e6374696f6e28636f6e646974696f6e292c0a0a20202020202020206f7074696f6e733a207b0a20202020202020202020202072616e6765733a20626f6f6c65616e2020202020202020202020286f7074696f6e616c3a2074727565203d3d3e20746f6b656e206c6f636174696f6e20696e666f2077696c6c20696e636c7564652061202e72616e67655b5d206d656d626572290a202020202020202020202020666c65783a20626f6f6c65616e20202020202020202020202020286f7074696f6e616c3a2074727565203d3d3e20666c65782d6c696b65206c6578696e67206265686176696f7572207768657265207468652072756c6573206172652074657374656420657868617573746976656c7920746f2066696e6420746865206c6f6e67657374206d61746368290a2020202020202020202020206261636b747261636b5f6c657865723a20626f6f6c65616e2020286f7074696f6e616c3a2074727565203d3d3e206c657865722072656765786573206172652074657374656420696e206f7264657220616e6420666f722065616368206d61746368696e672072656765782074686520616374696f6e20636f646520697320696e766f6b65643b20746865206c65786572207465726d696e6174657320746865207363616e207768656e206120746f6b656e2069732072657475726e65642062792074686520616374696f6e20636f6465290a20202020202020207d2c0a0a2020202020202020706572666f726d416374696f6e3a2066756e6374696f6e2879792c2079795f2c202461766f6964696e675f6e616d655f636f6c6c6973696f6e732c2059595f5354415254292c0a202020202020202072756c65733a205b2e2e2e5d2c0a2020202020202020636f6e646974696f6e733a207b6173736f63696174697665206c6973743a206e616d65203d3d3e207365747d2c0a202020207d0a20207d0a0a0a2020746f6b656e206c6f636174696f6e20696e666f202840242c205f242c206574632e293a207b0a2020202066697273745f6c696e653a206e2c0a202020206c6173745f6c696e653a206e2c0a2020202066697273745f636f6c756d6e3a206e2c0a202020206c6173745f636f6c756d6e3a206e2c0a2020202072616e67653a205b73746172745f6e756d6265722c20656e645f6e756d6265725d2020202020202028776865726520746865206e756d626572732061726520696e646578657320696e746f2074686520696e70757420737472696e672c20726567756c6172207a65726f2d6261736564290a20207d0a0a0a20207468652070617273654572726f722066756e6374696f6e207265636569766573206120276861736827206f626a6563742077697468207468657365206d656d6265727320666f72206c6578657220616e6420706172736572206572726f72733a207b0a20202020746578743a2020202020202020286d6174636865642074657874290a20202020746f6b656e3a20202020202020287468652070726f6475636564207465726d696e616c20746f6b656e2c20696620616e79290a202020206c696e653a20202020202020202879796c696e656e6f290a20207d0a20207768696c652070617273657220286772616d6d617229206572726f72732077696c6c20616c736f2070726f76696465207468657365206d656d626572732c20692e652e20706172736572206572726f72732064656c697665722061207375706572736574206f6620617474726962757465733a207b0a202020206c6f633a2020202020202020202879796c6c6f63290a2020202065787065637465643a2020202028737472696e672064657363726962696e672074686520736574206f6620657870656374656420746f6b656e73290a202020207265636f76657261626c653a2028626f6f6c65616e3a2054525545207768656e2074686520706172736572206861732061206572726f72207265636f766572792072756c6520617661696c61626c6520666f72207468697320706172746963756c6172206572726f72290a20207d0a2a2f0a76617220706172736572203d202866756e6374696f6e28297b0a766172206f3d66756e6374696f6e286b2c762c6f2c6c297b666f72286f3d6f7c7c7b7d2c6c3d6b2e6c656e6774683b6c2d2d3b6f5b6b5b6c5d5d3d76293b72657475726e206f7d2c2456303d5b312c395d2c2456313d5b312c31305d2c2456323d5b312c31315d2c2456333d5b312c31325d2c2456343d5b352c31312c31322c31332c31342c31355d3b0a76617220706172736572203d207b74726163653a2066756e6374696f6e2074726163652829207b207d2c0a79793a207b7d2c0a73796d626f6c735f3a207b226572726f72223a322c22726f6f74223a332c2265787072657373696f6e73223a342c22454f46223a352c2265787072657373696f6e223a362c226f7074696f6e616c223a372c226c69746572616c223a382c2273706c6174223a392c22706172616d223a31302c2228223a31312c2229223a31322c224c49544552414c223a31332c2253504c4154223a31342c22504152414d223a31352c2224616363657074223a302c2224656e64223a317d2c0a7465726d696e616c735f3a207b323a226572726f72222c353a22454f46222c31313a2228222c31323a2229222c31333a224c49544552414c222c31343a2253504c4154222c31353a22504152414d227d2c0a70726f64756374696f6e735f3a205b302c5b332c325d2c5b332c315d2c5b342c325d2c5b342c315d2c5b362c315d2c5b362c315d2c5b362c315d2c5b362c315d2c5b372c335d2c5b382c315d2c5b392c315d2c5b31302c315d5d2c0a706572666f726d416374696f6e3a2066756e6374696f6e20616e6f6e796d6f7573287979746578742c2079796c656e672c2079796c696e656e6f2c2079792c2079797374617465202f2a20616374696f6e5b315d202a2f2c202424202f2a2076737461636b202a2f2c205f24202f2a206c737461636b202a2f29207b0a2f2a2074686973203d3d20797976616c202a2f0a0a766172202430203d2024242e6c656e677468202d20313b0a73776974636820287979737461746529207b0a6361736520313a0a72657475726e206e65772079792e526f6f74287b7d2c5b24245b24302d315d5d290a627265616b3b0a6361736520323a0a72657475726e206e65772079792e526f6f74287b7d2c5b6e65772079792e4c69746572616c287b76616c75653a2027277d295d290a627265616b3b0a6361736520333a0a746869732e24203d206e65772079792e436f6e636174287b7d2c5b24245b24302d315d2c24245b24305d5d293b0a627265616b3b0a6361736520343a206361736520353a0a746869732e24203d2024245b24305d3b0a627265616b3b0a6361736520363a0a746869732e24203d206e65772079792e4c69746572616c287b76616c75653a2024245b24305d7d293b0a627265616b3b0a6361736520373a0a746869732e24203d206e65772079792e53706c6174287b6e616d653a2024245b24305d7d293b0a627265616b3b0a6361736520383a0a746869732e24203d206e65772079792e506172616d287b6e616d653a2024245b24305d7d293b0a627265616b3b0a6361736520393a0a746869732e24203d206e65772079792e4f7074696f6e616c287b7d2c5b24245b24302d315d5d293b0a627265616b3b0a636173652031303a0a746869732e24203d207979746578743b0a627265616b3b0a636173652031313a20636173652031323a0a746869732e24203d207979746578742e736c6963652831293b0a627265616b3b0a7d0a7d2c0a7461626c653a205b7b333a312c343a322c353a5b312c335d2c363a342c373a352c383a362c393a372c31303a382c31313a2456302c31333a2456312c31343a2456322c31353a2456337d2c7b313a5b335d7d2c7b353a5b312c31335d2c363a31342c373a352c383a362c393a372c31303a382c31313a2456302c31333a2456312c31343a2456322c31353a2456337d2c7b313a5b322c325d7d2c6f282456342c5b322c345d292c6f282456342c5b322c355d292c6f282456342c5b322c365d292c6f282456342c5b322c375d292c6f282456342c5b322c385d292c7b343a31352c363a342c373a352c383a362c393a372c31303a382c31313a2456302c31333a2456312c31343a2456322c31353a2456337d2c6f282456342c5b322c31305d292c6f282456342c5b322c31315d292c6f282456342c5b322c31325d292c7b313a5b322c315d7d2c6f282456342c5b322c335d292c7b363a31342c373a352c383a362c393a372c31303a382c31313a2456302c31323a5b312c31365d2c31333a2456312c31343a2456322c31353a2456337d2c6f282456342c5b322c395d295d2c0a64656661756c74416374696f6e733a207b333a5b322c325d2c31333a5b322c315d7d2c0a70617273654572726f723a2066756e6374696f6e2070617273654572726f72287374722c206861736829207b0a2020202069662028686173682e7265636f76657261626c6529207b0a2020202020202020746869732e747261636528737472293b0a202020207d20656c7365207b0a202020202020202066756e6374696f6e205f70617273654572726f7220286d73672c206861736829207b0a202020202020202020202020746869732e6d657373616765203d206d73673b0a202020202020202020202020746869732e68617368203d20686173683b0a20202020202020207d0a20202020202020205f70617273654572726f722e70726f746f74797065203d204572726f723b0a0a20202020202020207468726f77206e6577205f70617273654572726f72287374722c2068617368293b0a202020207d0a7d2c0a70617273653a2066756e6374696f6e20706172736528696e70757429207b0a2020202076617220746869732431203d20746869733b0a0a202020207661722073656c66203d20746869732c20737461636b203d205b305d2c2074737461636b203d205b5d2c2076737461636b203d205b6e756c6c5d2c206c737461636b203d205b5d2c207461626c65203d20746869732e7461626c652c20797974657874203d2027272c2079796c696e656e6f203d20302c2079796c656e67203d20302c207265636f766572696e67203d20302c20544552524f52203d20322c20454f46203d20313b0a202020207661722061726773203d206c737461636b2e736c6963652e63616c6c28617267756d656e74732c2031293b0a20202020766172206c65786572203d204f626a6563742e63726561746528746869732e6c65786572293b0a20202020766172207368617265645374617465203d207b2079793a207b7d207d3b0a20202020666f722028766172206b20696e20746869732e797929207b0a2020202020202020696620284f626a6563742e70726f746f747970652e6861734f776e50726f70657274792e63616c6c287468697324312e79792c206b2929207b0a20202020202020202020202073686172656453746174652e79795b6b5d203d207468697324312e79795b6b5d3b0a20202020202020207d0a202020207d0a202020206c657865722e736574496e70757428696e7075742c2073686172656453746174652e7979293b0a2020202073686172656453746174652e79792e6c65786572203d206c657865723b0a2020202073686172656453746174652e79792e706172736572203d20746869733b0a2020202069662028747970656f66206c657865722e79796c6c6f63203d3d2027756e646566696e65642729207b0a20202020202020206c657865722e79796c6c6f63203d207b7d3b0a202020207d0a202020207661722079796c6f63203d206c657865722e79796c6c6f633b0a202020206c737461636b2e707573682879796c6f63293b0a202020207661722072616e676573203d206c657865722e6f7074696f6e73202626206c657865722e6f7074696f6e732e72616e6765733b0a2020202069662028747970656f662073686172656453746174652e79792e70617273654572726f72203d3d3d202766756e6374696f6e2729207b0a2020202020202020746869732e70617273654572726f72203d2073686172656453746174652e79792e70617273654572726f723b0a202020207d20656c7365207b0a2020202020202020746869732e70617273654572726f72203d204f626a6563742e67657450726f746f747970654f662874686973292e70617273654572726f723b0a202020207d0a2020202066756e6374696f6e20706f70537461636b286e29207b0a2020202020202020737461636b2e6c656e677468203d20737461636b2e6c656e677468202d2032202a206e3b0a202020202020202076737461636b2e6c656e677468203d2076737461636b2e6c656e677468202d206e3b0a20202020202020206c737461636b2e6c656e677468203d206c737461636b2e6c656e677468202d206e3b0a202020207d0a202020205f746f6b656e5f737461636b3a0a2020202020202020766172206c6578203d2066756e6374696f6e202829207b0a20202020202020202020202076617220746f6b656e3b0a202020202020202020202020746f6b656e203d206c657865722e6c65782829207c7c20454f463b0a20202020202020202020202069662028747970656f6620746f6b656e20213d3d20276e756d6265722729207b0a20202020202020202020202020202020746f6b656e203d2073656c662e73796d626f6c735f5b746f6b656e5d207c7c20746f6b656e3b0a2020202020202020202020207d0a20202020202020202020202072657475726e20746f6b656e3b0a20202020202020207d3b0a202020207661722073796d626f6c2c207072654572726f7253796d626f6c2c2073746174652c20616374696f6e2c20612c20722c20797976616c203d207b7d2c20702c206c656e2c206e657753746174652c2065787065637465643b0a202020207768696c6520287472756529207b0a20202020202020207374617465203d20737461636b5b737461636b2e6c656e677468202d20315d3b0a2020202020202020696620287468697324312e64656661756c74416374696f6e735b73746174655d29207b0a202020202020202020202020616374696f6e203d207468697324312e64656661756c74416374696f6e735b73746174655d3b0a20202020202020207d20656c7365207b0a2020202020202020202020206966202873796d626f6c203d3d3d206e756c6c207c7c20747970656f662073796d626f6c203d3d2027756e646566696e65642729207b0a2020202020202020202020202020202073796d626f6c203d206c657828293b0a2020202020202020202020207d0a202020202020202020202020616374696f6e203d207461626c655b73746174655d202626207461626c655b73746174655d5b73796d626f6c5d3b0a20202020202020207d0a202020202020202020202020202020202020202069662028747970656f6620616374696f6e203d3d3d2027756e646566696e656427207c7c2021616374696f6e2e6c656e677468207c7c2021616374696f6e5b305d29207b0a2020202020202020202020202020202076617220657272537472203d2027273b0a202020202020202020202020202020206578706563746564203d205b5d3b0a20202020202020202020202020202020666f7220287020696e207461626c655b73746174655d29207b0a2020202020202020202020202020202020202020696620287468697324312e7465726d696e616c735f5b705d2026262070203e20544552524f5229207b0a20202020202020202020202020202020202020202020202065787065637465642e7075736828275c2727202b207468697324312e7465726d696e616c735f5b705d202b20275c2727293b0a20202020202020202020202020202020202020207d0a202020202020202020202020202020207d0a20202020202020202020202020202020696620286c657865722e73686f77506f736974696f6e29207b0a2020202020202020202020202020202020202020657272537472203d20275061727365206572726f72206f6e206c696e652027202b202879796c696e656e6f202b203129202b20273a5c6e27202b206c657865722e73686f77506f736974696f6e2829202b20275c6e457870656374696e672027202b2065787065637465642e6a6f696e28272c202729202b20272c20676f74205c2727202b20287468697324312e7465726d696e616c735f5b73796d626f6c5d207c7c2073796d626f6c29202b20275c27273b0a202020202020202020202020202020207d20656c7365207b0a2020202020202020202020202020202020202020657272537472203d20275061727365206572726f72206f6e206c696e652027202b202879796c696e656e6f202b203129202b20273a20556e65787065637465642027202b202873796d626f6c203d3d20454f46203f2027656e64206f6620696e70757427203a20275c2727202b20287468697324312e7465726d696e616c735f5b73796d626f6c5d207c7c2073796d626f6c29202b20275c2727293b0a202020202020202020202020202020207d0a202020202020202020202020202020207468697324312e70617273654572726f72286572725374722c207b0a2020202020202020202020202020202020202020746578743a206c657865722e6d617463682c0a2020202020202020202020202020202020202020746f6b656e3a207468697324312e7465726d696e616c735f5b73796d626f6c5d207c7c2073796d626f6c2c0a20202020202020202020202020202020202020206c696e653a206c657865722e79796c696e656e6f2c0a20202020202020202020202020202020202020206c6f633a2079796c6f632c0a202020202020202020202020202020202020202065787065637465643a2065787065637465640a202020202020202020202020202020207d293b0a2020202020202020202020207d0a202020202020202069662028616374696f6e5b305d20696e7374616e63656f6620417272617920262620616374696f6e2e6c656e677468203e203129207b0a2020202020202020202020207468726f77206e6577204572726f7228275061727365204572726f723a206d756c7469706c6520616374696f6e7320706f737369626c652061742073746174653a2027202b207374617465202b20272c20746f6b656e3a2027202b2073796d626f6c293b0a20202020202020207d0a20202020202020207377697463682028616374696f6e5b305d29207b0a20202020202020206361736520313a0a202020202020202020202020737461636b2e707573682873796d626f6c293b0a20202020202020202020202076737461636b2e70757368286c657865722e797974657874293b0a2020202020202020202020206c737461636b2e70757368286c657865722e79796c6c6f63293b0a202020202020202020202020737461636b2e7075736828616374696f6e5b315d293b0a20202020202020202020202073796d626f6c203d206e756c6c3b0a20202020202020202020202069662028217072654572726f7253796d626f6c29207b0a2020202020202020202020202020202079796c656e67203d206c657865722e79796c656e673b0a20202020202020202020202020202020797974657874203d206c657865722e7979746578743b0a2020202020202020202020202020202079796c696e656e6f203d206c657865722e79796c696e656e6f3b0a2020202020202020202020202020202079796c6f63203d206c657865722e79796c6c6f633b0a20202020202020202020202020202020696620287265636f766572696e67203e203029207b0a20202020202020202020202020202020202020207265636f766572696e672d2d3b0a202020202020202020202020202020207d0a2020202020202020202020207d20656c7365207b0a2020202020202020202020202020202073796d626f6c203d207072654572726f7253796d626f6c3b0a202020202020202020202020202020207072654572726f7253796d626f6c203d206e756c6c3b0a2020202020202020202020207d0a202020202020202020202020627265616b3b0a20202020202020206361736520323a0a2020202020202020202020206c656e203d207468697324312e70726f64756374696f6e735f5b616374696f6e5b315d5d5b315d3b0a202020202020202020202020797976616c2e24203d2076737461636b5b76737461636b2e6c656e677468202d206c656e5d3b0a202020202020202020202020797976616c2e5f24203d207b0a2020202020202020202020202020202066697273745f6c696e653a206c737461636b5b6c737461636b2e6c656e677468202d20286c656e207c7c2031295d2e66697273745f6c696e652c0a202020202020202020202020202020206c6173745f6c696e653a206c737461636b5b6c737461636b2e6c656e677468202d20315d2e6c6173745f6c696e652c0a2020202020202020202020202020202066697273745f636f6c756d6e3a206c737461636b5b6c737461636b2e6c656e677468202d20286c656e207c7c2031295d2e66697273745f636f6c756d6e2c0a202020202020202020202020202020206c6173745f636f6c756d6e3a206c737461636b5b6c737461636b2e6c656e677468202d20315d2e6c6173745f636f6c756d6e0a2020202020202020202020207d3b0a2020202020202020202020206966202872616e67657329207b0a20202020202020202020202020202020797976616c2e5f242e72616e6765203d205b0a20202020202020202020202020202020202020206c737461636b5b6c737461636b2e6c656e677468202d20286c656e207c7c2031295d2e72616e67655b305d2c0a20202020202020202020202020202020202020206c737461636b5b6c737461636b2e6c656e677468202d20315d2e72616e67655b315d0a202020202020202020202020202020205d3b0a2020202020202020202020207d0a20202020202020202020202072203d207468697324312e706572666f726d416374696f6e2e6170706c7928797976616c2c205b0a202020202020202020202020202020207979746578742c0a2020202020202020202020202020202079796c656e672c0a2020202020202020202020202020202079796c696e656e6f2c0a2020202020202020202020202020202073686172656453746174652e79792c0a20202020202020202020202020202020616374696f6e5b315d2c0a2020202020202020202020202020202076737461636b2c0a202020202020202020202020202020206c737461636b0a2020202020202020202020205d2e636f6e636174286172677329293b0a20202020202020202020202069662028747970656f66207220213d3d2027756e646566696e65642729207b0a2020202020202020202020202020202072657475726e20723b0a2020202020202020202020207d0a202020202020202020202020696620286c656e29207b0a20202020202020202020202020202020737461636b203d20737461636b2e736c69636528302c202d31202a206c656e202a2032293b0a2020202020202020202020202020202076737461636b203d2076737461636b2e736c69636528302c202d31202a206c656e293b0a202020202020202020202020202020206c737461636b203d206c737461636b2e736c69636528302c202d31202a206c656e293b0a2020202020202020202020207d0a202020202020202020202020737461636b2e70757368287468697324312e70726f64756374696f6e735f5b616374696f6e5b315d5d5b305d293b0a20202020202020202020202076737461636b2e7075736828797976616c2e24293b0a2020202020202020202020206c737461636b2e7075736828797976616c2e5f24293b0a2020202020202020202020206e65775374617465203d207461626c655b737461636b5b737461636b2e6c656e677468202d20325d5d5b737461636b5b737461636b2e6c656e677468202d20315d5d3b0a202020202020202020202020737461636b2e70757368286e65775374617465293b0a202020202020202020202020627265616b3b0a20202020202020206361736520333a0a20202020202020202020202072657475726e20747275653b0a20202020202020207d0a202020207d0a2020202072657475726e20747275653b0a7d7d3b0a2f2a2067656e657261746564206279206a69736f6e2d6c657820302e332e34202a2f0a766172206c65786572203d202866756e6374696f6e28297b0a766172206c65786572203d20287b0a0a454f463a312c0a0a70617273654572726f723a66756e6374696f6e2070617273654572726f72287374722c206861736829207b0a202020202020202069662028746869732e79792e70617273657229207b0a202020202020202020202020746869732e79792e7061727365722e70617273654572726f72287374722c2068617368293b0a20202020202020207d20656c7365207b0a2020202020202020202020207468726f77206e6577204572726f7228737472293b0a20202020202020207d0a202020207d2c0a0a2f2f2072657365747320746865206c657865722c2073657473206e657720696e7075740a736574496e7075743a66756e6374696f6e2028696e7075742c20797929207b0a2020202020202020746869732e7979203d207979207c7c20746869732e7979207c7c207b7d3b0a2020202020202020746869732e5f696e707574203d20696e7075743b0a2020202020202020746869732e5f6d6f7265203d20746869732e5f6261636b747261636b203d20746869732e646f6e65203d2066616c73653b0a2020202020202020746869732e79796c696e656e6f203d20746869732e79796c656e67203d20303b0a2020202020202020746869732e797974657874203d20746869732e6d617463686564203d20746869732e6d61746368203d2027273b0a2020202020202020746869732e636f6e646974696f6e537461636b203d205b27494e495449414c275d3b0a2020202020202020746869732e79796c6c6f63203d207b0a20202020202020202020202066697273745f6c696e653a20312c0a20202020202020202020202066697273745f636f6c756d6e3a20302c0a2020202020202020202020206c6173745f6c696e653a20312c0a2020202020202020202020206c6173745f636f6c756d6e3a20300a20202020202020207d3b0a202020202020202069662028746869732e6f7074696f6e732e72616e67657329207b0a202020202020202020202020746869732e79796c6c6f632e72616e6765203d205b302c305d3b0a20202020202020207d0a2020202020202020746869732e6f6666736574203d20303b0a202020202020202072657475726e20746869733b0a202020207d2c0a0a2f2f20636f6e73756d657320616e642072657475726e73206f6e6520636861722066726f6d2074686520696e7075740a696e7075743a66756e6374696f6e202829207b0a2020202020202020766172206368203d20746869732e5f696e7075745b305d3b0a2020202020202020746869732e797974657874202b3d2063683b0a2020202020202020746869732e79796c656e672b2b3b0a2020202020202020746869732e6f66667365742b2b3b0a2020202020202020746869732e6d61746368202b3d2063683b0a2020202020202020746869732e6d617463686564202b3d2063683b0a2020202020202020766172206c696e6573203d2063682e6d61746368282f283f3a5c725c6e3f7c5c6e292e2a2f67293b0a2020202020202020696620286c696e657329207b0a202020202020202020202020746869732e79796c696e656e6f2b2b3b0a202020202020202020202020746869732e79796c6c6f632e6c6173745f6c696e652b2b3b0a20202020202020207d20656c7365207b0a202020202020202020202020746869732e79796c6c6f632e6c6173745f636f6c756d6e2b2b3b0a20202020202020207d0a202020202020202069662028746869732e6f7074696f6e732e72616e67657329207b0a202020202020202020202020746869732e79796c6c6f632e72616e67655b315d2b2b3b0a20202020202020207d0a0a2020202020202020746869732e5f696e707574203d20746869732e5f696e7075742e736c6963652831293b0a202020202020202072657475726e2063683b0a202020207d2c0a0a2f2f20756e736869667473206f6e65206368617220286f72206120737472696e672920696e746f2074686520696e7075740a756e7075743a66756e6374696f6e2028636829207b0a2020202020202020766172206c656e203d2063682e6c656e6774683b0a2020202020202020766172206c696e6573203d2063682e73706c6974282f283f3a5c725c6e3f7c5c6e292f67293b0a0a2020202020202020746869732e5f696e707574203d206368202b20746869732e5f696e7075743b0a2020202020202020746869732e797974657874203d20746869732e7979746578742e73756273747228302c20746869732e7979746578742e6c656e677468202d206c656e293b0a20202020202020202f2f746869732e79796c656e67202d3d206c656e3b0a2020202020202020746869732e6f6666736574202d3d206c656e3b0a2020202020202020766172206f6c644c696e6573203d20746869732e6d617463682e73706c6974282f283f3a5c725c6e3f7c5c6e292f67293b0a2020202020202020746869732e6d61746368203d20746869732e6d617463682e73756273747228302c20746869732e6d617463682e6c656e677468202d2031293b0a2020202020202020746869732e6d617463686564203d20746869732e6d6174636865642e73756273747228302c20746869732e6d6174636865642e6c656e677468202d2031293b0a0a2020202020202020696620286c696e65732e6c656e677468202d203129207b0a202020202020202020202020746869732e79796c696e656e6f202d3d206c696e65732e6c656e677468202d20313b0a20202020202020207d0a20202020202020207661722072203d20746869732e79796c6c6f632e72616e67653b0a0a2020202020202020746869732e79796c6c6f63203d207b0a20202020202020202020202066697273745f6c696e653a20746869732e79796c6c6f632e66697273745f6c696e652c0a2020202020202020202020206c6173745f6c696e653a20746869732e79796c696e656e6f202b20312c0a20202020202020202020202066697273745f636f6c756d6e3a20746869732e79796c6c6f632e66697273745f636f6c756d6e2c0a2020202020202020202020206c6173745f636f6c756d6e3a206c696e6573203f0a20202020202020202020202020202020286c696e65732e6c656e677468203d3d3d206f6c644c696e65732e6c656e677468203f20746869732e79796c6c6f632e66697273745f636f6c756d6e203a2030290a20202020202020202020202020202020202b206f6c644c696e65735b6f6c644c696e65732e6c656e677468202d206c696e65732e6c656e6774685d2e6c656e677468202d206c696e65735b305d2e6c656e677468203a0a2020202020202020202020202020746869732e79796c6c6f632e66697273745f636f6c756d6e202d206c656e0a20202020202020207d3b0a0a202020202020202069662028746869732e6f7074696f6e732e72616e67657329207b0a202020202020202020202020746869732e79796c6c6f632e72616e6765203d205b725b305d2c20725b305d202b20746869732e79796c656e67202d206c656e5d3b0a20202020202020207d0a2020202020202020746869732e79796c656e67203d20746869732e7979746578742e6c656e6774683b0a202020202020202072657475726e20746869733b0a202020207d2c0a0a2f2f205768656e2063616c6c65642066726f6d20616374696f6e2c20636163686573206d617463686564207465787420616e6420617070656e6473206974206f6e206e65787420616374696f6e0a6d6f72653a66756e6374696f6e202829207b0a2020202020202020746869732e5f6d6f7265203d20747275653b0a202020202020202072657475726e20746869733b0a202020207d2c0a0a2f2f205768656e2063616c6c65642066726f6d20616374696f6e2c207369676e616c7320746865206c65786572207468617420746869732072756c65206661696c7320746f206d617463682074686520696e7075742c20736f20746865206e657874206d61746368696e672072756c6520287265676578292073686f756c642062652074657374656420696e73746561642e0a72656a6563743a66756e6374696f6e202829207b0a202020202020202069662028746869732e6f7074696f6e732e6261636b747261636b5f6c6578657229207b0a202020202020202020202020746869732e5f6261636b747261636b203d20747275653b0a20202020202020207d20656c7365207b0a20202020202020202020202072657475726e20746869732e70617273654572726f7228274c65786963616c206572726f72206f6e206c696e652027202b2028746869732e79796c696e656e6f202b203129202b20272e20596f752063616e206f6e6c7920696e766f6b652072656a656374282920696e20746865206c65786572207768656e20746865206c65786572206973206f6620746865206261636b747261636b696e672070657273756173696f6e20286f7074696f6e732e6261636b747261636b5f6c65786572203d2074727565292e5c6e27202b20746869732e73686f77506f736974696f6e28292c207b0a20202020202020202020202020202020746578743a2022222c0a20202020202020202020202020202020746f6b656e3a206e756c6c2c0a202020202020202020202020202020206c696e653a20746869732e79796c696e656e6f0a2020202020202020202020207d293b0a0a20202020202020207d0a202020202020202072657475726e20746869733b0a202020207d2c0a0a2f2f2072657461696e206669727374206e2063686172616374657273206f6620746865206d617463680a6c6573733a66756e6374696f6e20286e29207b0a2020202020202020746869732e756e70757428746869732e6d617463682e736c696365286e29293b0a202020207d2c0a0a2f2f20646973706c61797320616c7265616479206d61746368656420696e7075742c20692e652e20666f72206572726f72206d657373616765730a70617374496e7075743a66756e6374696f6e202829207b0a20202020202020207661722070617374203d20746869732e6d6174636865642e73756273747228302c20746869732e6d6174636865642e6c656e677468202d20746869732e6d617463682e6c656e677468293b0a202020202020202072657475726e2028706173742e6c656e677468203e203230203f20272e2e2e273a272729202b20706173742e737562737472282d3230292e7265706c616365282f5c6e2f672c202222293b0a202020207d2c0a0a2f2f20646973706c617973207570636f6d696e6720696e7075742c20692e652e20666f72206572726f72206d657373616765730a7570636f6d696e67496e7075743a66756e6374696f6e202829207b0a2020202020202020766172206e657874203d20746869732e6d617463683b0a2020202020202020696620286e6578742e6c656e677468203c20323029207b0a2020202020202020202020206e657874202b3d20746869732e5f696e7075742e73756273747228302c2032302d6e6578742e6c656e677468293b0a20202020202020207d0a202020202020202072657475726e20286e6578742e73756273747228302c323029202b20286e6578742e6c656e677468203e203230203f20272e2e2e27203a20272729292e7265706c616365282f5c6e2f672c202222293b0a202020207d2c0a0a2f2f20646973706c617973207468652063686172616374657220706f736974696f6e20776865726520746865206c6578696e67206572726f72206f636375727265642c20692e652e20666f72206572726f72206d657373616765730a73686f77506f736974696f6e3a66756e6374696f6e202829207b0a202020202020202076617220707265203d20746869732e70617374496e70757428293b0a20202020202020207661722063203d206e6577204172726179287072652e6c656e677468202b2031292e6a6f696e28222d22293b0a202020202020202072657475726e20707265202b20746869732e7570636f6d696e67496e7075742829202b20225c6e22202b2063202b20225e223b0a202020207d2c0a0a2f2f207465737420746865206c6578656420746f6b656e3a2072657475726e2046414c5345207768656e206e6f742061206d617463682c206f74686572776973652072657475726e20746f6b656e0a746573745f6d617463683a66756e6374696f6e20286d617463682c20696e64657865645f72756c6529207b0a202020202020202076617220746869732431203d20746869733b0a0a202020202020202076617220746f6b656e2c0a2020202020202020202020206c696e65732c0a2020202020202020202020206261636b75703b0a0a202020202020202069662028746869732e6f7074696f6e732e6261636b747261636b5f6c6578657229207b0a2020202020202020202020202f2f207361766520636f6e746578740a2020202020202020202020206261636b7570203d207b0a2020202020202020202020202020202079796c696e656e6f3a20746869732e79796c696e656e6f2c0a2020202020202020202020202020202079796c6c6f633a207b0a202020202020202020202020202020202020202066697273745f6c696e653a20746869732e79796c6c6f632e66697273745f6c696e652c0a20202020202020202020202020202020202020206c6173745f6c696e653a20746869732e6c6173745f6c696e652c0a202020202020202020202020202020202020202066697273745f636f6c756d6e3a20746869732e79796c6c6f632e66697273745f636f6c756d6e2c0a20202020202020202020202020202020202020206c6173745f636f6c756d6e3a20746869732e79796c6c6f632e6c6173745f636f6c756d6e0a202020202020202020202020202020207d2c0a202020202020202020202020202020207979746578743a20746869732e7979746578742c0a202020202020202020202020202020206d617463683a20746869732e6d617463682c0a202020202020202020202020202020206d6174636865733a20746869732e6d6174636865732c0a202020202020202020202020202020206d6174636865643a20746869732e6d6174636865642c0a2020202020202020202020202020202079796c656e673a20746869732e79796c656e672c0a202020202020202020202020202020206f66667365743a20746869732e6f66667365742c0a202020202020202020202020202020205f6d6f72653a20746869732e5f6d6f72652c0a202020202020202020202020202020205f696e7075743a20746869732e5f696e7075742c0a2020202020202020202020202020202079793a20746869732e79792c0a20202020202020202020202020202020636f6e646974696f6e537461636b3a20746869732e636f6e646974696f6e537461636b2e736c6963652830292c0a20202020202020202020202020202020646f6e653a20746869732e646f6e650a2020202020202020202020207d3b0a20202020202020202020202069662028746869732e6f7074696f6e732e72616e67657329207b0a202020202020202020202020202020206261636b75702e79796c6c6f632e72616e6765203d20746869732e79796c6c6f632e72616e67652e736c6963652830293b0a2020202020202020202020207d0a20202020202020207d0a0a20202020202020206c696e6573203d206d617463685b305d2e6d61746368282f283f3a5c725c6e3f7c5c6e292e2a2f67293b0a2020202020202020696620286c696e657329207b0a202020202020202020202020746869732e79796c696e656e6f202b3d206c696e65732e6c656e6774683b0a20202020202020207d0a2020202020202020746869732e79796c6c6f63203d207b0a20202020202020202020202066697273745f6c696e653a20746869732e79796c6c6f632e6c6173745f6c696e652c0a2020202020202020202020206c6173745f6c696e653a20746869732e79796c696e656e6f202b20312c0a20202020202020202020202066697273745f636f6c756d6e3a20746869732e79796c6c6f632e6c6173745f636f6c756d6e2c0a2020202020202020202020206c6173745f636f6c756d6e3a206c696e6573203f0a202020202020202020202020202020202020202020202020206c696e65735b6c696e65732e6c656e677468202d20315d2e6c656e677468202d206c696e65735b6c696e65732e6c656e677468202d20315d2e6d61746368282f5c723f5c6e3f2f295b305d2e6c656e677468203a0a20202020202020202020202020202020202020202020202020746869732e79796c6c6f632e6c6173745f636f6c756d6e202b206d617463685b305d2e6c656e6774680a20202020202020207d3b0a2020202020202020746869732e797974657874202b3d206d617463685b305d3b0a2020202020202020746869732e6d61746368202b3d206d617463685b305d3b0a2020202020202020746869732e6d617463686573203d206d617463683b0a2020202020202020746869732e79796c656e67203d20746869732e7979746578742e6c656e6774683b0a202020202020202069662028746869732e6f7074696f6e732e72616e67657329207b0a202020202020202020202020746869732e79796c6c6f632e72616e6765203d205b746869732e6f66667365742c20746869732e6f6666736574202b3d20746869732e79796c656e675d3b0a20202020202020207d0a2020202020202020746869732e5f6d6f7265203d2066616c73653b0a2020202020202020746869732e5f6261636b747261636b203d2066616c73653b0a2020202020202020746869732e5f696e707574203d20746869732e5f696e7075742e736c696365286d617463685b305d2e6c656e677468293b0a2020202020202020746869732e6d617463686564202b3d206d617463685b305d3b0a2020202020202020746f6b656e203d20746869732e706572666f726d416374696f6e2e63616c6c28746869732c20746869732e79792c20746869732c20696e64657865645f72756c652c20746869732e636f6e646974696f6e537461636b5b746869732e636f6e646974696f6e537461636b2e6c656e677468202d20315d293b0a202020202020202069662028746869732e646f6e6520262620746869732e5f696e70757429207b0a202020202020202020202020746869732e646f6e65203d2066616c73653b0a20202020202020207d0a202020202020202069662028746f6b656e29207b0a20202020202020202020202072657475726e20746f6b656e3b0a20202020202020207d20656c73652069662028746869732e5f6261636b747261636b29207b0a2020202020202020202020202f2f207265636f76657220636f6e746578740a202020202020202020202020666f722028766172206b20696e206261636b757029207b0a202020202020202020202020202020207468697324315b6b5d203d206261636b75705b6b5d3b0a2020202020202020202020207d0a20202020202020202020202072657475726e2066616c73653b202f2f2072756c6520616374696f6e2063616c6c65642072656a656374282920696d706c79696e6720746865206e6578742072756c652073686f756c642062652074657374656420696e73746561642e0a20202020202020207d0a202020202020202072657475726e2066616c73653b0a202020207d2c0a0a2f2f2072657475726e206e657874206d6174636820696e20696e7075740a6e6578743a66756e6374696f6e202829207b0a202020202020202076617220746869732431203d20746869733b0a0a202020202020202069662028746869732e646f6e6529207b0a20202020202020202020202072657475726e20746869732e454f463b0a20202020202020207d0a20202020202020206966202821746869732e5f696e70757429207b0a202020202020202020202020746869732e646f6e65203d20747275653b0a20202020202020207d0a0a202020202020202076617220746f6b656e2c0a2020202020202020202020206d617463682c0a20202020202020202020202074656d704d617463682c0a202020202020202020202020696e6465783b0a20202020202020206966202821746869732e5f6d6f726529207b0a202020202020202020202020746869732e797974657874203d2027273b0a202020202020202020202020746869732e6d61746368203d2027273b0a20202020202020207d0a20202020202020207661722072756c6573203d20746869732e5f63757272656e7452756c657328293b0a2020202020202020666f7220287661722069203d20303b2069203c2072756c65732e6c656e6774683b20692b2b29207b0a20202020202020202020202074656d704d61746368203d207468697324312e5f696e7075742e6d61746368287468697324312e72756c65735b72756c65735b695d5d293b0a2020202020202020202020206966202874656d704d617463682026262028216d61746368207c7c2074656d704d617463685b305d2e6c656e677468203e206d617463685b305d2e6c656e6774682929207b0a202020202020202020202020202020206d61746368203d2074656d704d617463683b0a20202020202020202020202020202020696e646578203d20693b0a20202020202020202020202020202020696620287468697324312e6f7074696f6e732e6261636b747261636b5f6c6578657229207b0a2020202020202020202020202020202020202020746f6b656e203d207468697324312e746573745f6d617463682874656d704d617463682c2072756c65735b695d293b0a202020202020202020202020202020202020202069662028746f6b656e20213d3d2066616c736529207b0a20202020202020202020202020202020202020202020202072657475726e20746f6b656e3b0a20202020202020202020202020202020202020207d20656c736520696620287468697324312e5f6261636b747261636b29207b0a2020202020202020202020202020202020202020202020206d61746368203d2066616c73653b0a202020202020202020202020202020202020202020202020636f6e74696e75653b202f2f2072756c6520616374696f6e2063616c6c65642072656a656374282920696d706c79696e6720612072756c65204d49536d617463682e0a20202020202020202020202020202020202020207d20656c7365207b0a2020202020202020202020202020202020202020202020202f2f20656c73653a20746869732069732061206c657865722072756c6520776869636820636f6e73756d657320696e70757420776974686f75742070726f647563696e67206120746f6b656e2028652e672e2077686974657370616365290a20202020202020202020202020202020202020202020202072657475726e2066616c73653b0a20202020202020202020202020202020202020207d0a202020202020202020202020202020207d20656c73652069662028217468697324312e6f7074696f6e732e666c657829207b0a2020202020202020202020202020202020202020627265616b3b0a202020202020202020202020202020207d0a2020202020202020202020207d0a20202020202020207d0a2020202020202020696620286d6174636829207b0a202020202020202020202020746f6b656e203d20746869732e746573745f6d61746368286d617463682c2072756c65735b696e6465785d293b0a20202020202020202020202069662028746f6b656e20213d3d2066616c736529207b0a2020202020202020202020202020202072657475726e20746f6b656e3b0a2020202020202020202020207d0a2020202020202020202020202f2f20656c73653a20746869732069732061206c657865722072756c6520776869636820636f6e73756d657320696e70757420776974686f75742070726f647563696e67206120746f6b656e2028652e672e2077686974657370616365290a20202020202020202020202072657475726e2066616c73653b0a20202020202020207d0a202020202020202069662028746869732e5f696e707574203d3d3d20222229207b0a20202020202020202020202072657475726e20746869732e454f463b0a20202020202020207d20656c7365207b0a20202020202020202020202072657475726e20746869732e70617273654572726f7228274c65786963616c206572726f72206f6e206c696e652027202b2028746869732e79796c696e656e6f202b203129202b20272e20556e7265636f676e697a656420746578742e5c6e27202b20746869732e73686f77506f736974696f6e28292c207b0a20202020202020202020202020202020746578743a2022222c0a20202020202020202020202020202020746f6b656e3a206e756c6c2c0a202020202020202020202020202020206c696e653a20746869732e79796c696e656e6f0a2020202020202020202020207d293b0a20202020202020207d0a202020207d2c0a0a2f2f2072657475726e206e657874206d61746368207468617420686173206120746f6b656e0a6c65783a66756e6374696f6e206c65782829207b0a20202020202020207661722072203d20746869732e6e65787428293b0a2020202020202020696620287229207b0a20202020202020202020202072657475726e20723b0a20202020202020207d20656c7365207b0a20202020202020202020202072657475726e20746869732e6c657828293b0a20202020202020207d0a202020207d2c0a0a2f2f206163746976617465732061206e6577206c6578657220636f6e646974696f6e207374617465202870757368657320746865206e6577206c6578657220636f6e646974696f6e207374617465206f6e746f2074686520636f6e646974696f6e20737461636b290a626567696e3a66756e6374696f6e20626567696e28636f6e646974696f6e29207b0a2020202020202020746869732e636f6e646974696f6e537461636b2e7075736828636f6e646974696f6e293b0a202020207d2c0a0a2f2f20706f70207468652070726576696f75736c7920616374697665206c6578657220636f6e646974696f6e207374617465206f66662074686520636f6e646974696f6e20737461636b0a706f7053746174653a66756e6374696f6e20706f7053746174652829207b0a2020202020202020766172206e203d20746869732e636f6e646974696f6e537461636b2e6c656e677468202d20313b0a2020202020202020696620286e203e203029207b0a20202020202020202020202072657475726e20746869732e636f6e646974696f6e537461636b2e706f7028293b0a20202020202020207d20656c7365207b0a20202020202020202020202072657475726e20746869732e636f6e646974696f6e537461636b5b305d3b0a20202020202020207d0a202020207d2c0a0a2f2f2070726f6475636520746865206c657865722072756c65207365742077686963682069732061637469766520666f72207468652063757272656e746c7920616374697665206c6578657220636f6e646974696f6e2073746174650a5f63757272656e7452756c65733a66756e6374696f6e205f63757272656e7452756c65732829207b0a202020202020202069662028746869732e636f6e646974696f6e537461636b2e6c656e67746820262620746869732e636f6e646974696f6e537461636b5b746869732e636f6e646974696f6e537461636b2e6c656e677468202d20315d29207b0a20202020202020202020202072657475726e20746869732e636f6e646974696f6e735b746869732e636f6e646974696f6e537461636b5b746869732e636f6e646974696f6e537461636b2e6c656e677468202d20315d5d2e72756c65733b0a20202020202020207d20656c7365207b0a20202020202020202020202072657475726e20746869732e636f6e646974696f6e735b22494e495449414c225d2e72756c65733b0a20202020202020207d0a202020207d2c0a0a2f2f2072657475726e207468652063757272656e746c7920616374697665206c6578657220636f6e646974696f6e2073746174653b207768656e20616e20696e64657820617267756d656e742069732070726f76696465642069742070726f647563657320746865204e2d74682070726576696f757320636f6e646974696f6e2073746174652c20696620617661696c61626c650a746f7053746174653a66756e6374696f6e20746f705374617465286e29207b0a20202020202020206e203d20746869732e636f6e646974696f6e537461636b2e6c656e677468202d2031202d204d6174682e616273286e207c7c2030293b0a2020202020202020696620286e203e3d203029207b0a20202020202020202020202072657475726e20746869732e636f6e646974696f6e537461636b5b6e5d3b0a20202020202020207d20656c7365207b0a20202020202020202020202072657475726e2022494e495449414c223b0a20202020202020207d0a202020207d2c0a0a2f2f20616c69617320666f7220626567696e28636f6e646974696f6e290a7075736853746174653a66756e6374696f6e2070757368537461746528636f6e646974696f6e29207b0a2020202020202020746869732e626567696e28636f6e646974696f6e293b0a202020207d2c0a0a2f2f2072657475726e20746865206e756d626572206f66207374617465732063757272656e746c79206f6e2074686520737461636b0a7374617465537461636b53697a653a66756e6374696f6e207374617465537461636b53697a652829207b0a202020202020202072657475726e20746869732e636f6e646974696f6e537461636b2e6c656e6774683b0a202020207d2c0a6f7074696f6e733a207b7d2c0a706572666f726d416374696f6e3a2066756e6374696f6e20616e6f6e796d6f75732879792c79795f2c2461766f6964696e675f6e616d655f636f6c6c6973696f6e732c59595f535441525429207b0a76617220595953544154453d59595f53544152543b0a737769746368282461766f6964696e675f6e616d655f636f6c6c6973696f6e7329207b0a6361736520303a72657475726e202228223b0a627265616b3b0a6361736520313a72657475726e202229223b0a627265616b3b0a6361736520323a72657475726e202253504c4154223b0a627265616b3b0a6361736520333a72657475726e2022504152414d223b0a627265616b3b0a6361736520343a72657475726e20224c49544552414c223b0a627265616b3b0a6361736520353a72657475726e20224c49544552414c223b0a627265616b3b0a6361736520363a72657475726e2022454f46223b0a627265616b3b0a7d0a7d2c0a72756c65733a205b2f5e283f3a5c28292f2c2f5e283f3a5c29292f2c2f5e283f3a5c2a2b5c772b292f2c2f5e283f3a3a2b5c772b292f2c2f5e283f3a5b5c77255c2d7e5c6e5d2b292f2c2f5e283f3a2e292f2c2f5e283f3a24292f5d2c0a636f6e646974696f6e733a207b22494e495449414c223a7b2272756c6573223a5b302c312c322c332c342c352c365d2c22696e636c7573697665223a747275657d7d0a7d293b0a72657475726e206c657865723b0a7d2928293b0a7061727365722e6c65786572203d206c657865723b0a66756e6374696f6e20506172736572202829207b0a2020746869732e7979203d207b7d3b0a7d0a5061727365722e70726f746f74797065203d207061727365723b7061727365722e506172736572203d205061727365723b0a72657475726e206e6577205061727365723b0a7d2928293b0a0a0a696620282766756e6374696f6e2720213d3d2027756e646566696e65642720262620747970656f66206578706f72747320213d3d2027756e646566696e65642729207b0a6578706f7274732e706172736572203d207061727365723b0a6578706f7274732e506172736572203d207061727365722e5061727365723b0a6578706f7274732e7061727365203d2066756e6374696f6e202829207b2072657475726e207061727365722e70617273652e6170706c79287061727365722c20617267756d656e7473293b207d3b0a7d0a7d293b0a0a76617220636f6d70696c65644772616d6d61722431203d20696e7465726f7044656661756c7428636f6d70696c65644772616d6d6172293b0a766172207061727365203d20636f6d70696c65644772616d6d61722e70617273653b0a76617220506172736572203d20636f6d70696c65644772616d6d61722e5061727365723b0a766172207061727365722432203d20636f6d70696c65644772616d6d61722e7061727365723b0a0a7661722072657175697265242431203d204f626a6563742e667265657a65287b0a202064656661756c743a20636f6d70696c65644772616d6d617224312c0a202070617273653a2070617273652c0a20205061727365723a205061727365722c0a20207061727365723a2070617273657224320a7d293b0a0a766172206e6f646573203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2775736520737472696374273b0a2f2a2a20406d6f64756c6520726f7574652f6e6f646573202a2f0a0a0a2f2a2a0a202a204372656174652061206e6f646520666f7220757365207769746820746865207061727365722c20676976696e67206974206120636f6e7374727563746f7220746861742074616b65730a202a2070726f70732c206368696c6472656e2c20616e642072657475726e7320616e206f626a65637420776974682070726f70732c206368696c6472656e2c20616e6420610a202a20646973706c61794e616d652e0a202a2040706172616d20207b537472696e677d20646973706c61794e616d652054686520646973706c6179206e616d6520666f7220746865206e6f64650a202a204072657475726e207b7b646973706c61794e616d653a20737472696e672c2070726f70733a204f626a6563742c206368696c6472656e3a2041727261797d7d0a202a2f0a66756e6374696f6e206372656174654e6f646528646973706c61794e616d6529207b0a202072657475726e2066756e6374696f6e2870726f70732c206368696c6472656e29207b0a2020202072657475726e207b0a202020202020646973706c61794e616d653a20646973706c61794e616d652c0a20202020202070726f70733a2070726f70732c0a2020202020206368696c6472656e3a206368696c6472656e207c7c205b5d0a202020207d3b0a20207d3b0a7d0a0a6d6f64756c652e6578706f727473203d207b0a2020526f6f743a206372656174654e6f64652827526f6f7427292c0a2020436f6e6361743a206372656174654e6f64652827436f6e63617427292c0a20204c69746572616c3a206372656174654e6f646528274c69746572616c27292c0a202053706c61743a206372656174654e6f6465282753706c617427292c0a2020506172616d3a206372656174654e6f64652827506172616d27292c0a20204f7074696f6e616c3a206372656174654e6f646528274f7074696f6e616c27290a7d3b0a7d293b0a0a766172206e6f6465732431203d20696e7465726f7044656661756c74286e6f646573293b0a76617220526f6f74203d206e6f6465732e526f6f743b0a76617220436f6e636174203d206e6f6465732e436f6e6361743b0a766172204c69746572616c203d206e6f6465732e4c69746572616c3b0a7661722053706c6174203d206e6f6465732e53706c61743b0a76617220506172616d203d206e6f6465732e506172616d3b0a766172204f7074696f6e616c203d206e6f6465732e4f7074696f6e616c3b0a0a76617220726571756972652424302431203d204f626a6563742e667265657a65287b0a202064656661756c743a206e6f64657324312c0a2020526f6f743a20526f6f742c0a2020436f6e6361743a20436f6e6361742c0a20204c69746572616c3a204c69746572616c2c0a202053706c61743a2053706c61742c0a2020506172616d3a20506172616d2c0a20204f7074696f6e616c3a204f7074696f6e616c0a7d293b0a0a76617220706172736572203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2f2a2a0a202a20406d6f64756c6520726f7574652f7061727365720a202a2f0a2775736520737472696374273b0a0a2f2a2a20577261702074686520636f6d70696c65642070617273657220776974682074686520636f6e7465787420746f20637265617465206e6f6465206f626a65637473202a2f0a76617220706172736572203d20696e7465726f7044656661756c742872657175697265242431292e7061727365723b0a7061727365722e7979203d20696e7465726f7044656661756c7428726571756972652424302431293b0a6d6f64756c652e6578706f727473203d207061727365723b0a7d293b0a0a766172207061727365722431203d20696e7465726f7044656661756c7428706172736572293b0a0a0a7661722072657175697265242432203d204f626a6563742e667265657a65287b0a0964656661756c743a2070617273657224310a7d293b0a0a766172206372656174655f76697369746f72203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2775736520737472696374273b0a2f2a2a0a202a20406d6f64756c6520726f7574652f76697369746f72732f6372656174655f76697369746f720a202a2f0a0a766172206e6f64655479706573203d204f626a6563742e6b65797328696e7465726f7044656661756c742872657175697265242430243129293b0a0a2f2a2a0a202a2048656c70657220666f72206372656174696e672076697369746f72732e2054616b6520616e206f626a656374206f66206e6f6465206e616d6520746f2068616e646c65720a202a206d617070696e67732c2072657475726e7320616e206f626a656374207769746820612022766973697422206d6574686f6420746861742063616e2062652063616c6c65640a202a2040706172616d20207b4f626a6563742e3c737472696e672c66756e6374696f6e286e6f64652c636f6e74657874293e7d2068616e646c6572732041206d617070696e67206f66206e6f64650a202a207479706520746f2076697369746f722066756e6374696f6e730a202a204072657475726e207b7b76697369743a2066756e6374696f6e286e6f64652c636f6e74657874297d7d2020412076697369746f72206f626a6563742077697468206120227669736974220a202a206d6574686f6420746861742063616e2062652063616c6c6564206f6e2061206e6f64652077697468206120636f6e746578740a202a2f0a66756e6374696f6e2063726561746556697369746f722868616e646c65727329207b0a20206e6f646554797065732e666f72456163682866756e6374696f6e286e6f64655479706529207b0a2020202069662820747970656f662068616e646c6572735b6e6f6465547970655d203d3d3d2027756e646566696e65642729207b0a2020202020207468726f77206e6577204572726f7228274e6f2068616e646c657220646566696e656420666f722027202b206e6f6465547970652e646973706c61794e616d65293b0a202020207d0a0a20207d293b0a0a202072657475726e207b0a202020202f2a2a0a20202020202a2043616c6c2074686520676976656e2068616e646c657220666f722074686973206e6f646520747970650a20202020202a2040706172616d20207b4f626a6563747d206e6f64652020202074686520415354206e6f64650a20202020202a2040706172616d20207b4f626a6563747d20636f6e7465787420636f6e7465787420746f2070617373207468726f75676820746f2068616e646c6572730a20202020202a204072657475726e207b4f626a6563747d0a20202020202a2f0a2020202076697369743a2066756e6374696f6e286e6f64652c20636f6e7465787429207b0a20202020202072657475726e20746869732e68616e646c6572735b6e6f64652e646973706c61794e616d655d2e63616c6c28746869732c6e6f64652c20636f6e74657874293b0a202020207d2c0a2020202068616e646c6572733a2068616e646c6572730a20207d3b0a7d0a0a6d6f64756c652e6578706f727473203d2063726561746556697369746f723b0a7d293b0a0a766172206372656174655f76697369746f722431203d20696e7465726f7044656661756c74286372656174655f76697369746f72293b0a0a0a76617220726571756972652424302432203d204f626a6563742e667265657a65287b0a202064656661756c743a206372656174655f76697369746f7224310a7d293b0a0a76617220726567657870203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2775736520737472696374273b0a0a7661722063726561746556697369746f7220203d20696e7465726f7044656661756c7428726571756972652424302432292c0a20202020657363617065526567457870203d202f5b5c2d7b7d5c5b5c5d2b3f2e2c5c5c5c5e247c235c735d2f673b0a0a2f2a2a0a202a2040636c6173730a202a2040707269766174650a202a2f0a66756e6374696f6e204d617463686572286f7074696f6e7329207b0a2020746869732e6361707475726573203d206f7074696f6e732e63617074757265733b0a2020746869732e7265203d206f7074696f6e732e72653b0a7d0a0a2f2a2a0a202a20547279206d61746368696e672061207061746820616761696e7374207468652067656e65726174656420726567756c61722065787072657373696f6e0a202a2040706172616d20207b537472696e677d207061746820546865207061746820746f2074727920746f206d617463680a202a204072657475726e207b4f626a6563747c66616c73657d2020202020206d61746368656420706172616d6574657273206f722066616c73650a202a2f0a4d6174636865722e70726f746f747970652e6d61746368203d2066756e6374696f6e20287061746829207b0a2020766172206d61746368203d20746869732e72652e657865632870617468292c0a2020202020206d61746368506172616d73203d207b7d3b0a0a202069662820216d617463682029207b0a2020202072657475726e3b0a20207d0a0a2020746869732e63617074757265732e666f7245616368282066756e6374696f6e28636170747572652c206929207b0a2020202069662820747970656f66206d617463685b692b315d203d3d3d2027756e646566696e6564272029207b0a2020202020206d61746368506172616d735b636170747572655d203d20756e646566696e65643b0a202020207d0a20202020656c7365207b0a2020202020206d61746368506172616d735b636170747572655d203d206465636f6465555249436f6d706f6e656e74286d617463685b692b315d293b0a202020207d0a20207d293b0a0a202072657475726e206d61746368506172616d733b0a7d3b0a0a2f2a2a0a202a2056697369746f7220666f72207468652041535420746f20637265617465206120726567756c61722065787072657373696f6e206d6174636865720a202a2040636c6173732052656765787056697369746f720a202a2040626f72726f77732056697369746f722d76697369740a202a2f0a7661722052656765787056697369746f72203d2063726561746556697369746f72287b0a202027436f6e636174273a2066756e6374696f6e286e6f646529207b0a2020202072657475726e206e6f64652e6368696c6472656e0a2020202020202e726564756365280a202020202020202066756e6374696f6e286d656d6f2c206368696c6429207b0a20202020202020202020766172206368696c64526573756c74203d20746869732e7669736974286368696c64293b0a2020202020202020202072657475726e207b0a20202020202020202020202072653a206d656d6f2e7265202b206368696c64526573756c742e72652c0a20202020202020202020202063617074757265733a206d656d6f2e63617074757265732e636f6e636174286368696c64526573756c742e6361707475726573290a202020202020202020207d3b0a20202020202020207d2e62696e642874686973292c0a20202020202020207b72653a2027272c2063617074757265733a205b5d7d0a202020202020293b0a20207d2c0a2020274c69746572616c273a2066756e6374696f6e286e6f646529207b0a2020202072657475726e207b0a20202020202072653a206e6f64652e70726f70732e76616c75652e7265706c616365286573636170655265674578702c20275c5c242627292c0a20202020202063617074757265733a205b5d0a202020207d3b0a20207d2c0a0a20202753706c6174273a2066756e6374696f6e286e6f646529207b0a2020202072657475726e207b0a20202020202072653a2027285b5e3f5d2a3f29272c0a20202020202063617074757265733a205b6e6f64652e70726f70732e6e616d655d0a202020207d3b0a20207d2c0a0a202027506172616d273a2066756e6374696f6e286e6f646529207b0a2020202072657475726e207b0a20202020202072653a2027285b5e5c5c2f5c5c3f5d2b29272c0a20202020202063617074757265733a205b6e6f64652e70726f70732e6e616d655d0a202020207d3b0a20207d2c0a0a2020274f7074696f6e616c273a2066756e6374696f6e286e6f646529207b0a20202020766172206368696c64203d20746869732e7669736974286e6f64652e6368696c6472656e5b305d293b0a2020202072657475726e207b0a20202020202072653a2027283f3a27202b206368696c642e7265202b2027293f272c0a20202020202063617074757265733a206368696c642e63617074757265730a202020207d3b0a20207d2c0a0a202027526f6f74273a2066756e6374696f6e286e6f646529207b0a20202020766172206368696c64526573756c74203d20746869732e7669736974286e6f64652e6368696c6472656e5b305d293b0a2020202072657475726e206e6577204d617463686572287b0a20202020202072653a206e65772052656745787028275e27202b206368696c64526573756c742e7265202b2027283f3d5c5c3f7c24292720292c0a20202020202063617074757265733a206368696c64526573756c742e63617074757265730a202020207d293b0a20207d0a7d293b0a0a6d6f64756c652e6578706f727473203d2052656765787056697369746f723b0a7d293b0a0a766172207265676578702431203d20696e7465726f7044656661756c7428726567657870293b0a0a0a76617220726571756972652424312431203d204f626a6563742e667265657a65287b0a202064656661756c743a2072656765787024310a7d293b0a0a7661722072657665727365203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2775736520737472696374273b0a0a7661722063726561746556697369746f7220203d20696e7465726f7044656661756c7428726571756972652424302432293b0a0a2f2a2a0a202a2056697369746f7220666f72207468652041535420746f20636f6e7374727563742061207061746820776974682066696c6c656420696e20706172616d65746572730a202a2040636c617373205265766572736556697369746f720a202a2040626f72726f77732056697369746f722d76697369740a202a2f0a766172205265766572736556697369746f72203d2063726561746556697369746f72287b0a202027436f6e636174273a2066756e6374696f6e286e6f64652c20636f6e7465787429207b0a20202020766172206368696c64526573756c7473203d20206e6f64652e6368696c6472656e0a2020202020202e6d6170282066756e6374696f6e286368696c6429207b0a202020202020202072657475726e20746869732e7669736974286368696c642c636f6e74657874293b0a2020202020207d2e62696e64287468697329293b0a0a20202020696628206368696c64526573756c74732e736f6d652866756e6374696f6e286329207b2072657475726e2063203d3d3d2066616c73653b207d292029207b0a20202020202072657475726e2066616c73653b0a202020207d0a20202020656c7365207b0a20202020202072657475726e206368696c64526573756c74732e6a6f696e282727293b0a202020207d0a20207d2c0a0a2020274c69746572616c273a2066756e6374696f6e286e6f646529207b0a2020202072657475726e206465636f6465555249286e6f64652e70726f70732e76616c7565293b0a20207d2c0a0a20202753706c6174273a2066756e6374696f6e286e6f64652c20636f6e7465787429207b0a2020202069662820636f6e746578745b6e6f64652e70726f70732e6e616d655d2029207b0a20202020202072657475726e20636f6e746578745b6e6f64652e70726f70732e6e616d655d3b0a202020207d0a20202020656c7365207b0a20202020202072657475726e2066616c73653b0a202020207d0a20207d2c0a0a202027506172616d273a2066756e6374696f6e286e6f64652c20636f6e7465787429207b0a2020202069662820636f6e746578745b6e6f64652e70726f70732e6e616d655d2029207b0a20202020202072657475726e20636f6e746578745b6e6f64652e70726f70732e6e616d655d3b0a202020207d0a20202020656c7365207b0a20202020202072657475726e2066616c73653b0a202020207d0a20207d2c0a0a2020274f7074696f6e616c273a2066756e6374696f6e286e6f64652c20636f6e7465787429207b0a20202020766172206368696c64526573756c74203d20746869732e7669736974286e6f64652e6368696c6472656e5b305d2c20636f6e74657874293b0a20202020696628206368696c64526573756c742029207b0a20202020202072657475726e206368696c64526573756c743b0a202020207d0a20202020656c7365207b0a20202020202072657475726e2027273b0a202020207d0a20207d2c0a0a202027526f6f74273a2066756e6374696f6e286e6f64652c20636f6e7465787429207b0a20202020636f6e74657874203d20636f6e74657874207c7c207b7d3b0a20202020766172206368696c64526573756c74203d20746869732e7669736974286e6f64652e6368696c6472656e5b305d2c20636f6e74657874293b0a2020202069662820216368696c64526573756c742029207b0a20202020202072657475726e2066616c73653b0a202020207d0a2020202072657475726e20656e636f6465555249286368696c64526573756c74293b0a20207d0a7d293b0a0a6d6f64756c652e6578706f727473203d205265766572736556697369746f723b0a7d293b0a0a76617220726576657273652431203d20696e7465726f7044656661756c742872657665727365293b0a0a0a76617220726571756972652424302433203d204f626a6563742e667265657a65287b0a202064656661756c743a207265766572736524310a7d293b0a0a76617220726f757465203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2775736520737472696374273b0a76617220506172736572203d20696e7465726f7044656661756c742872657175697265242432292c0a2020202052656765787056697369746f72203d20696e7465726f7044656661756c7428726571756972652424312431292c0a202020205265766572736556697369746f72203d20696e7465726f7044656661756c7428726571756972652424302433293b0a0a526f7574652e70726f746f74797065203d204f626a6563742e637265617465286e756c6c290a0a2f2a2a0a202a204d617463682061207061746820616761696e7374207468697320726f7574652c2072657475726e696e6720746865206d61746368656420706172616d65746572732069660a202a206974206d6174636865732c2066616c7365206966206e6f742e0a202a20406578616d706c650a202a2076617220726f757465203d206e657720526f75746528272f746869732f69732f6d792f726f75746527290a202a20726f7574652e6d6174636828272f746869732f69732f6d792f726f7574652729202f2f202d3e207b7d0a202a20406578616d706c650a202a2076617220726f757465203d206e657720526f75746528272f3a6f6e652f3a74776f27290a202a20726f7574652e6d6174636828272f666f6f2f6261722f2729202f2f202d3e207b6f6e653a2027666f6f272c2074776f3a2027626172277d0a202a2040706172616d20207b737472696e677d207061746820746865207061746820746f206d61746368207468697320726f75746520616761696e73740a202a204072657475726e207b284f626a6563742e3c737472696e672c737472696e673e7c66616c7365297d2041206d6170206f6620746865206d61746368656420726f7574650a202a20706172616d65746572732c206f722066616c7365206966206d61746368696e67206661696c65640a202a2f0a526f7574652e70726f746f747970652e6d61746368203d2066756e6374696f6e287061746829207b0a2020766172207265203d2052656765787056697369746f722e766973697428746869732e617374292c0a2020202020206d617463686564203d2072652e6d617463682870617468293b0a0a202072657475726e206d617463686564203f206d617463686564203a2066616c73653b0a0a7d3b0a0a2f2a2a0a202a2052657665727365206120726f7574652073706563696669636174696f6e20746f206120706174682c2072657475726e696e672066616c73652069662069742063616e27742062650a202a2066756c66696c6c65640a202a20406578616d706c650a202a2076617220726f757465203d206e657720526f75746528272f3a6f6e652f3a74776f27290a202a20726f7574652e72657665727365287b6f6e653a2027666f6f272c2074776f3a2027626172277d29202d3e20272f666f6f2f626172270a202a2040706172616d20207b4f626a6563747d20706172616d732054686520706172616d657465727320746f2066696c6c20696e0a202a204072657475726e207b28537472696e677c66616c7365297d205468652066696c6c656420696e20706174680a202a2f0a526f7574652e70726f746f747970652e72657665727365203d2066756e6374696f6e28706172616d7329207b0a202072657475726e205265766572736556697369746f722e766973697428746869732e6173742c20706172616d73293b0a7d3b0a0a2f2a2a0a202a20526570726573656e7473206120726f7574650a202a20406578616d706c650a202a2076617220726f757465203d20526f75746528272f3a666f6f2f3a62617227293b0a202a20406578616d706c650a202a2076617220726f757465203d20526f75746528272f3a666f6f2f3a62617227293b0a202a2040706172616d207b737472696e677d2073706563202d202074686520737472696e672073706563696669636174696f6e206f662074686520726f7574652e0a202a2020202020757365203a706172616d20666f722073696e676c6520706f7274696f6e2063617074757265732c202a706172616d20666f722073706c6174207374796c652063617074757265732c0a202a2020202020616e6420282920666f72206f7074696f6e616c20726f757465206272616e636865730a202a2040636f6e7374727563746f720a202a2f0a66756e6374696f6e20526f757465287370656329207b0a202076617220726f7574653b0a2020696620287468697329207b0a202020202f2f20636f6e7374727563746f722063616c6c65642077697468206e65770a20202020726f757465203d20746869733b0a20207d20656c7365207b0a202020202f2f20636f6e7374727563746f722063616c6c656420617320612066756e6374696f6e0a20202020726f757465203d204f626a6563742e63726561746528526f7574652e70726f746f74797065293b0a20207d0a202069662820747970656f662073706563203d3d3d2027756e646566696e6564272029207b0a202020207468726f77206e6577204572726f7228274120726f757465207370656320697320726571756972656427293b0a20207d0a2020726f7574652e73706563203d20737065633b0a2020726f7574652e617374203d205061727365722e70617273652873706563293b0a202072657475726e20726f7574653b0a7d0a0a6d6f64756c652e6578706f727473203d20526f7574653b0a7d293b0a0a76617220726f7574652431203d20696e7465726f7044656661756c7428726f757465293b0a0a0a7661722072657175697265242430203d204f626a6563742e667265657a65287b0a202064656661756c743a20726f75746524310a7d293b0a0a76617220696e646578203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2f2a2a0a202a20406d6f64756c6520506173736167650a202a2f0a2775736520737472696374273b0a0a76617220526f757465203d20696e7465726f7044656661756c742872657175697265242430293b0a0a0a6d6f64756c652e6578706f727473203d20526f7574653b0a7d293b0a0a76617220526f757465203d20696e7465726f7044656661756c7428696e646578293b0a0a7661722070756e79636f6465203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c652c206578706f72747329207b0a2f2a212068747470733a2f2f6d7468732e62652f70756e79636f64652076312e332e3220627920406d617468696173202a2f0a3b2866756e6374696f6e28726f6f7429207b0a0a092f2a2a204465746563742066726565207661726961626c6573202a2f0a0976617220667265654578706f727473203d20747970656f66206578706f727473203d3d20276f626a65637427202626206578706f7274732026260a0909216578706f7274732e6e6f646554797065202626206578706f7274733b0a0976617220667265654d6f64756c65203d20747970656f66206d6f64756c65203d3d20276f626a65637427202626206d6f64756c652026260a0909216d6f64756c652e6e6f646554797065202626206d6f64756c653b0a097661722066726565476c6f62616c203d20747970656f6620636f6d6d6f6e6a73476c6f62616c203d3d20276f626a6563742720262620636f6d6d6f6e6a73476c6f62616c3b0a09696620280a090966726565476c6f62616c2e676c6f62616c203d3d3d2066726565476c6f62616c207c7c0a090966726565476c6f62616c2e77696e646f77203d3d3d2066726565476c6f62616c207c7c0a090966726565476c6f62616c2e73656c66203d3d3d2066726565476c6f62616c0a0929207b0a0909726f6f74203d2066726565476c6f62616c3b0a097d0a0a092f2a2a0a09202a20546865206070756e79636f646560206f626a6563742e0a09202a20406e616d652070756e79636f64650a09202a204074797065204f626a6563740a09202a2f0a097661722070756e79636f64652c0a0a092f2a2a204869676865737420706f736974697665207369676e65642033322d62697420666c6f61742076616c7565202a2f0a096d6178496e74203d20323134373438333634372c202f2f20616b612e2030783746464646464646206f7220325e33312d310a0a092f2a2a20426f6f74737472696e6720706172616d6574657273202a2f0a0962617365203d2033362c0a09744d696e203d20312c0a09744d6178203d2032362c0a09736b6577203d2033382c0a0964616d70203d203730302c0a09696e697469616c42696173203d2037322c0a09696e697469616c4e203d203132382c202f2f20307838300a0964656c696d69746572203d20272d272c202f2f20275c783244270a0a092f2a2a20526567756c61722065787072657373696f6e73202a2f0a09726567657850756e79636f6465203d202f5e786e2d2d2f2c0a0972656765784e6f6e4153434949203d202f5b5e5c7832302d5c7837455d2f2c202f2f20756e7072696e7461626c65204153434949206368617273202b206e6f6e2d41534349492063686172730a097265676578536570617261746f7273203d202f5b5c7832455c75333030325c75464630455c75464636315d2f672c202f2f20524643203334393020736570617261746f72730a0a092f2a2a204572726f72206d65737361676573202a2f0a096572726f7273203d207b0a0909276f766572666c6f77273a20274f766572666c6f773a20696e707574206e6565647320776964657220696e74656765727320746f2070726f63657373272c0a0909276e6f742d6261736963273a2027496c6c6567616c20696e707574203e3d203078383020286e6f74206120626173696320636f646520706f696e7429272c0a090927696e76616c69642d696e707574273a2027496e76616c696420696e707574270a097d2c0a0a092f2a2a20436f6e76656e69656e63652073686f727463757473202a2f0a09626173654d696e7573544d696e203d2062617365202d20744d696e2c0a09666c6f6f72203d204d6174682e666c6f6f722c0a09737472696e6746726f6d43686172436f6465203d20537472696e672e66726f6d43686172436f64652c0a0a092f2a2a2054656d706f72617279207661726961626c65202a2f0a096b65793b0a0a092f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a0a092f2a2a0a09202a20412067656e65726963206572726f72207574696c6974792066756e6374696f6e2e0a09202a2040707269766174650a09202a2040706172616d207b537472696e677d207479706520546865206572726f7220747970652e0a09202a204072657475726e73207b4572726f727d205468726f77732061206052616e67654572726f7260207769746820746865206170706c696361626c65206572726f72206d6573736167652e0a09202a2f0a0966756e6374696f6e206572726f72287479706529207b0a09097468726f772052616e67654572726f72286572726f72735b747970655d293b0a097d0a0a092f2a2a0a09202a20412067656e6572696320604172726179236d617060207574696c6974792066756e6374696f6e2e0a09202a2040707269766174650a09202a2040706172616d207b41727261797d2061727261792054686520617272617920746f2069746572617465206f7665722e0a09202a2040706172616d207b46756e6374696f6e7d2063616c6c6261636b205468652066756e6374696f6e207468617420676574732063616c6c656420666f722065766572792061727261790a09202a206974656d2e0a09202a204072657475726e73207b41727261797d2041206e6577206172726179206f662076616c7565732072657475726e6564206279207468652063616c6c6261636b2066756e6374696f6e2e0a09202a2f0a0966756e6374696f6e206d61702861727261792c20666e29207b0a0909766172206c656e677468203d2061727261792e6c656e6774683b0a090976617220726573756c74203d205b5d3b0a09097768696c6520286c656e6774682d2d29207b0a090909726573756c745b6c656e6774685d203d20666e2861727261795b6c656e6774685d293b0a09097d0a090972657475726e20726573756c743b0a097d0a0a092f2a2a0a09202a20412073696d706c6520604172726179236d6170602d6c696b65207772617070657220746f20776f726b207769746820646f6d61696e206e616d6520737472696e6773206f7220656d61696c0a09202a206164647265737365732e0a09202a2040707269766174650a09202a2040706172616d207b537472696e677d20646f6d61696e2054686520646f6d61696e206e616d65206f7220656d61696c20616464726573732e0a09202a2040706172616d207b46756e6374696f6e7d2063616c6c6261636b205468652066756e6374696f6e207468617420676574732063616c6c656420666f722065766572790a09202a206368617261637465722e0a09202a204072657475726e73207b41727261797d2041206e657720737472696e67206f6620636861726163746572732072657475726e6564206279207468652063616c6c6261636b0a09202a2066756e6374696f6e2e0a09202a2f0a0966756e6374696f6e206d6170446f6d61696e28737472696e672c20666e29207b0a0909766172207061727473203d20737472696e672e73706c697428274027293b0a090976617220726573756c74203d2027273b0a09096966202870617274732e6c656e677468203e203129207b0a0909092f2f20496e20656d61696c206164647265737365732c206f6e6c792074686520646f6d61696e206e616d652073686f756c642062652070756e79636f6465642e204c656176650a0909092f2f20746865206c6f63616c20706172742028692e652e2065766572797468696e6720757020746f206040602920696e746163742e0a090909726573756c74203d2070617274735b305d202b202740273b0a090909737472696e67203d2070617274735b315d3b0a09097d0a09092f2f2041766f6964206073706c6974287265676578296020666f722049453820636f6d7061746962696c6974792e20536565202331372e0a0909737472696e67203d20737472696e672e7265706c616365287265676578536570617261746f72732c20275c78324527293b0a0909766172206c6162656c73203d20737472696e672e73706c697428272e27293b0a090976617220656e636f646564203d206d6170286c6162656c732c20666e292e6a6f696e28272e27293b0a090972657475726e20726573756c74202b20656e636f6465643b0a097d0a0a092f2a2a0a09202a204372656174657320616e20617272617920636f6e7461696e696e6720746865206e756d6572696320636f646520706f696e7473206f66206561636820556e69636f64650a09202a2063686172616374657220696e2074686520737472696e672e205768696c65204a6176615363726970742075736573205543532d3220696e7465726e616c6c792c0a09202a20746869732066756e6374696f6e2077696c6c20636f6e7665727420612070616972206f6620737572726f676174652068616c766573202865616368206f662077686963680a09202a205543532d32206578706f73657320617320736570617261746520636861726163746572732920696e746f20612073696e676c6520636f646520706f696e742c0a09202a206d61746368696e67205554462d31362e0a09202a2040736565206070756e79636f64652e756373322e656e636f6465600a09202a2040736565203c68747470733a2f2f6d61746869617362796e656e732e62652f6e6f7465732f6a6176617363726970742d656e636f64696e673e0a09202a20406d656d6265724f662070756e79636f64652e756373320a09202a20406e616d65206465636f64650a09202a2040706172616d207b537472696e677d20737472696e672054686520556e69636f646520696e70757420737472696e6720285543532d32292e0a09202a204072657475726e73207b41727261797d20546865206e6577206172726179206f6620636f646520706f696e74732e0a09202a2f0a0966756e6374696f6e20756373326465636f646528737472696e6729207b0a0909766172206f7574707574203d205b5d2c0a090920202020636f756e746572203d20302c0a0909202020206c656e677468203d20737472696e672e6c656e6774682c0a09092020202076616c75652c0a09092020202065787472613b0a09097768696c652028636f756e746572203c206c656e67746829207b0a09090976616c7565203d20737472696e672e63686172436f6465417428636f756e7465722b2b293b0a0909096966202876616c7565203e3d203078443830302026262076616c7565203c3d2030784442464620262620636f756e746572203c206c656e67746829207b0a090909092f2f206869676820737572726f676174652c20616e642074686572652069732061206e657874206368617261637465720a090909096578747261203d20737472696e672e63686172436f6465417428636f756e7465722b2b293b0a090909096966202828657874726120262030784643303029203d3d2030784443303029207b202f2f206c6f7720737572726f676174650a09090909096f75747075742e7075736828282876616c7565202620307833464629203c3c20313029202b20286578747261202620307833464629202b2030783130303030293b0a090909097d20656c7365207b0a09090909092f2f20756e6d61746368656420737572726f676174653b206f6e6c7920617070656e64207468697320636f646520756e69742c20696e206361736520746865206e6578740a09090909092f2f20636f646520756e697420697320746865206869676820737572726f67617465206f66206120737572726f6761746520706169720a09090909096f75747075742e707573682876616c7565293b0a0909090909636f756e7465722d2d3b0a090909097d0a0909097d20656c7365207b0a090909096f75747075742e707573682876616c7565293b0a0909097d0a09097d0a090972657475726e206f75747075743b0a097d0a0a092f2a2a0a09202a2043726561746573206120737472696e67206261736564206f6e20616e206172726179206f66206e756d6572696320636f646520706f696e74732e0a09202a2040736565206070756e79636f64652e756373322e6465636f6465600a09202a20406d656d6265724f662070756e79636f64652e756373320a09202a20406e616d6520656e636f64650a09202a2040706172616d207b41727261797d20636f6465506f696e747320546865206172726179206f66206e756d6572696320636f646520706f696e74732e0a09202a204072657475726e73207b537472696e677d20546865206e657720556e69636f646520737472696e6720285543532d32292e0a09202a2f0a0966756e6374696f6e2075637332656e636f646528617272617929207b0a090972657475726e206d61702861727261792c2066756e6374696f6e2876616c756529207b0a090909766172206f7574707574203d2027273b0a0909096966202876616c7565203e2030784646464629207b0a0909090976616c7565202d3d20307831303030303b0a090909096f7574707574202b3d20737472696e6746726f6d43686172436f64652876616c7565203e3e3e2031302026203078334646207c20307844383030293b0a0909090976616c7565203d20307844433030207c2076616c756520262030783346463b0a0909097d0a0909096f7574707574202b3d20737472696e6746726f6d43686172436f64652876616c7565293b0a09090972657475726e206f75747075743b0a09097d292e6a6f696e282727293b0a097d0a0a092f2a2a0a09202a20436f6e7665727473206120626173696320636f646520706f696e7420696e746f20612064696769742f696e74656765722e0a09202a204073656520606469676974546f42617369632829600a09202a2040707269766174650a09202a2040706172616d207b4e756d6265727d20636f6465506f696e7420546865206261736963206e756d6572696320636f646520706f696e742076616c75652e0a09202a204072657475726e73207b4e756d6265727d20546865206e756d657269632076616c7565206f66206120626173696320636f646520706f696e742028666f722075736520696e0a09202a20726570726573656e74696e6720696e7465676572732920696e207468652072616e67652060306020746f206062617365202d2031602c206f72206062617365602069660a09202a2074686520636f646520706f696e7420646f6573206e6f7420726570726573656e7420612076616c75652e0a09202a2f0a0966756e6374696f6e206261736963546f446967697428636f6465506f696e7429207b0a090969662028636f6465506f696e74202d203438203c20313029207b0a09090972657475726e20636f6465506f696e74202d2032323b0a09097d0a090969662028636f6465506f696e74202d203635203c20323629207b0a09090972657475726e20636f6465506f696e74202d2036353b0a09097d0a090969662028636f6465506f696e74202d203937203c20323629207b0a09090972657475726e20636f6465506f696e74202d2039373b0a09097d0a090972657475726e20626173653b0a097d0a0a092f2a2a0a09202a20436f6e766572747320612064696769742f696e746567657220696e746f206120626173696320636f646520706f696e742e0a09202a204073656520606261736963546f44696769742829600a09202a2040707269766174650a09202a2040706172616d207b4e756d6265727d20646967697420546865206e756d657269632076616c7565206f66206120626173696320636f646520706f696e742e0a09202a204072657475726e73207b4e756d6265727d2054686520626173696320636f646520706f696e742077686f73652076616c756520287768656e207573656420666f720a09202a20726570726573656e74696e6720696e7465676572732920697320606469676974602c207768696368206e6565647320746f20626520696e207468652072616e67650a09202a2060306020746f206062617365202d2031602e2049662060666c616760206973206e6f6e2d7a65726f2c207468652075707065726361736520666f726d2069730a09202a20757365643b20656c73652c20746865206c6f7765726361736520666f726d20697320757365642e20546865206265686176696f7220697320756e646566696e65640a09202a2069662060666c616760206973206e6f6e2d7a65726f20616e64206064696769746020686173206e6f2075707065726361736520666f726d2e0a09202a2f0a0966756e6374696f6e206469676974546f42617369632864696769742c20666c616729207b0a09092f2f2020302e2e3235206d617020746f20415343494920612e2e7a206f7220412e2e5a0a09092f2f2032362e2e3335206d617020746f20415343494920302e2e390a090972657475726e206469676974202b203232202b203735202a20286469676974203c20323629202d202828666c616720213d203029203c3c2035293b0a097d0a0a092f2a2a0a09202a20426961732061646170746174696f6e2066756e6374696f6e206173207065722073656374696f6e20332e34206f662052464320333439322e0a09202a20687474703a2f2f746f6f6c732e696574662e6f72672f68746d6c2f726663333439322373656374696f6e2d332e340a09202a2040707269766174650a09202a2f0a0966756e6374696f6e2061646170742864656c74612c206e756d506f696e74732c20666972737454696d6529207b0a0909766172206b203d20303b0a090964656c7461203d20666972737454696d65203f20666c6f6f722864656c7461202f2064616d7029203a2064656c7461203e3e20313b0a090964656c7461202b3d20666c6f6f722864656c7461202f206e756d506f696e7473293b0a0909666f7220282f2a206e6f20696e697469616c697a6174696f6e202a2f3b2064656c7461203e20626173654d696e7573544d696e202a20744d6178203e3e20313b206b202b3d206261736529207b0a09090964656c7461203d20666c6f6f722864656c7461202f20626173654d696e7573544d696e293b0a09097d0a090972657475726e20666c6f6f72286b202b2028626173654d696e7573544d696e202b203129202a2064656c7461202f202864656c7461202b20736b657729293b0a097d0a0a092f2a2a0a09202a20436f6e766572747320612050756e79636f646520737472696e67206f662041534349492d6f6e6c792073796d626f6c7320746f206120737472696e67206f6620556e69636f64650a09202a2073796d626f6c732e0a09202a20406d656d6265724f662070756e79636f64650a09202a2040706172616d207b537472696e677d20696e707574205468652050756e79636f646520737472696e67206f662041534349492d6f6e6c792073796d626f6c732e0a09202a204072657475726e73207b537472696e677d2054686520726573756c74696e6720737472696e67206f6620556e69636f64652073796d626f6c732e0a09202a2f0a0966756e6374696f6e206465636f646528696e70757429207b0a09092f2f20446f6e277420757365205543532d320a0909766172206f7574707574203d205b5d2c0a090920202020696e7075744c656e677468203d20696e7075742e6c656e6774682c0a0909202020206f75742c0a09092020202069203d20302c0a0909202020206e203d20696e697469616c4e2c0a09092020202062696173203d20696e697469616c426961732c0a09092020202062617369632c0a0909202020206a2c0a090920202020696e6465782c0a0909202020206f6c64692c0a090920202020772c0a0909202020206b2c0a09092020202064696769742c0a090920202020742c0a0909202020202f2a2a204361636865642063616c63756c6174696f6e20726573756c7473202a2f0a090920202020626173654d696e7573543b0a0a09092f2f2048616e646c652074686520626173696320636f646520706f696e74733a206c6574206062617369636020626520746865206e756d626572206f6620696e70757420636f64650a09092f2f20706f696e7473206265666f726520746865206c6173742064656c696d697465722c206f7220603060206966207468657265206973206e6f6e652c207468656e20636f70790a09092f2f2074686520666972737420626173696320636f646520706f696e747320746f20746865206f75747075742e0a0a09096261736963203d20696e7075742e6c617374496e6465784f662864656c696d69746572293b0a0909696620286261736963203c203029207b0a0909096261736963203d20303b0a09097d0a0a0909666f7220286a203d20303b206a203c2062617369633b202b2b6a29207b0a0909092f2f2069662069742773206e6f74206120626173696320636f646520706f696e740a09090969662028696e7075742e63686172436f64654174286a29203e3d203078383029207b0a090909096572726f7228276e6f742d626173696327293b0a0909097d0a0909096f75747075742e7075736828696e7075742e63686172436f64654174286a29293b0a09097d0a0a09092f2f204d61696e206465636f64696e67206c6f6f703a207374617274206a75737420616674657220746865206c6173742064656c696d6974657220696620616e7920626173696320636f64650a09092f2f20706f696e7473207765726520636f706965643b2073746172742061742074686520626567696e6e696e67206f74686572776973652e0a0a0909666f722028696e646578203d206261736963203e2030203f206261736963202b2031203a20303b20696e646578203c20696e7075744c656e6774683b202f2a206e6f2066696e616c2065787072657373696f6e202a2f29207b0a0a0909092f2f2060696e646578602069732074686520696e646578206f6620746865206e6578742063686172616374657220746f20626520636f6e73756d65642e0a0909092f2f204465636f646520612067656e6572616c697a6564207661726961626c652d6c656e67746820696e746567657220696e746f206064656c7461602c0a0909092f2f207768696368206765747320616464656420746f206069602e20546865206f766572666c6f7720636865636b696e67206973206561736965720a0909092f2f20696620776520696e6372656173652060696020617320776520676f2c207468656e207375627472616374206f666620697473207374617274696e670a0909092f2f2076616c75652061742074686520656e6420746f206f627461696e206064656c7461602e0a090909666f7220286f6c6469203d20692c2077203d20312c206b203d20626173653b202f2a206e6f20636f6e646974696f6e202a2f3b206b202b3d206261736529207b0a0a0909090969662028696e646578203e3d20696e7075744c656e67746829207b0a09090909096572726f722827696e76616c69642d696e70757427293b0a090909097d0a0a090909096469676974203d206261736963546f446967697428696e7075742e63686172436f6465417428696e6465782b2b29293b0a0a09090909696620286469676974203e3d2062617365207c7c206469676974203e20666c6f6f7228286d6178496e74202d206929202f20772929207b0a09090909096572726f7228276f766572666c6f7727293b0a090909097d0a0a0909090969202b3d206469676974202a20773b0a0909090974203d206b203c3d2062696173203f20744d696e203a20286b203e3d2062696173202b20744d6178203f20744d6178203a206b202d2062696173293b0a0a09090909696620286469676974203c207429207b0a0909090909627265616b3b0a090909097d0a0a09090909626173654d696e757354203d2062617365202d20743b0a090909096966202877203e20666c6f6f72286d6178496e74202f20626173654d696e7573542929207b0a09090909096572726f7228276f766572666c6f7727293b0a090909097d0a0a0909090977202a3d20626173654d696e7573543b0a0a0909097d0a0a0909096f7574203d206f75747075742e6c656e677468202b20313b0a09090962696173203d2061646170742869202d206f6c64692c206f75742c206f6c6469203d3d2030293b0a0a0909092f2f206069602077617320737570706f73656420746f20777261702061726f756e642066726f6d20606f75746020746f206030602c0a0909092f2f20696e6372656d656e74696e6720606e6020656163682074696d652c20736f207765276c6c206669782074686174206e6f773a0a09090969662028666c6f6f722869202f206f757429203e206d6178496e74202d206e29207b0a090909096572726f7228276f766572666c6f7727293b0a0909097d0a0a0909096e202b3d20666c6f6f722869202f206f7574293b0a0909096920253d206f75743b0a0a0909092f2f20496e7365727420606e6020617420706f736974696f6e20606960206f6620746865206f75747075740a0909096f75747075742e73706c69636528692b2b2c20302c206e293b0a0a09097d0a0a090972657475726e2075637332656e636f6465286f7574707574293b0a097d0a0a092f2a2a0a09202a20436f6e7665727473206120737472696e67206f6620556e69636f64652073796d626f6c732028652e672e206120646f6d61696e206e616d65206c6162656c2920746f20610a09202a2050756e79636f646520737472696e67206f662041534349492d6f6e6c792073796d626f6c732e0a09202a20406d656d6265724f662070756e79636f64650a09202a2040706172616d207b537472696e677d20696e7075742054686520737472696e67206f6620556e69636f64652073796d626f6c732e0a09202a204072657475726e73207b537472696e677d2054686520726573756c74696e672050756e79636f646520737472696e67206f662041534349492d6f6e6c792073796d626f6c732e0a09202a2f0a0966756e6374696f6e20656e636f646528696e70757429207b0a0909766172206e2c0a09092020202064656c74612c0a09092020202068616e646c65644350436f756e742c0a09092020202062617369634c656e6774682c0a090920202020626961732c0a0909202020206a2c0a0909202020206d2c0a090920202020712c0a0909202020206b2c0a090920202020742c0a09092020202063757272656e7456616c75652c0a0909202020206f7574707574203d205b5d2c0a0909202020202f2a2a2060696e7075744c656e677468602077696c6c20686f6c6420746865206e756d626572206f6620636f646520706f696e747320696e2060696e707574602e202a2f0a090920202020696e7075744c656e6774682c0a0909202020202f2a2a204361636865642063616c63756c6174696f6e20726573756c7473202a2f0a09092020202068616e646c65644350436f756e74506c75734f6e652c0a090920202020626173654d696e7573542c0a090920202020714d696e7573543b0a0a09092f2f20436f6e766572742074686520696e70757420696e205543532d3220746f20556e69636f64650a0909696e707574203d20756373326465636f646528696e707574293b0a0a09092f2f20436163686520746865206c656e6774680a0909696e7075744c656e677468203d20696e7075742e6c656e6774683b0a0a09092f2f20496e697469616c697a65207468652073746174650a09096e203d20696e697469616c4e3b0a090964656c7461203d20303b0a090962696173203d20696e697469616c426961733b0a0a09092f2f2048616e646c652074686520626173696320636f646520706f696e74730a0909666f7220286a203d20303b206a203c20696e7075744c656e6774683b202b2b6a29207b0a09090963757272656e7456616c7565203d20696e7075745b6a5d3b0a0909096966202863757272656e7456616c7565203c203078383029207b0a090909096f75747075742e7075736828737472696e6746726f6d43686172436f64652863757272656e7456616c756529293b0a0909097d0a09097d0a0a090968616e646c65644350436f756e74203d2062617369634c656e677468203d206f75747075742e6c656e6774683b0a0a09092f2f206068616e646c65644350436f756e746020697320746865206e756d626572206f6620636f646520706f696e747320746861742068617665206265656e2068616e646c65643b0a09092f2f206062617369634c656e6774686020697320746865206e756d626572206f6620626173696320636f646520706f696e74732e0a0a09092f2f2046696e6973682074686520626173696320737472696e67202d206966206974206973206e6f7420656d707479202d207769746820612064656c696d697465720a09096966202862617369634c656e67746829207b0a0909096f75747075742e707573682864656c696d69746572293b0a09097d0a0a09092f2f204d61696e20656e636f64696e67206c6f6f703a0a09097768696c65202868616e646c65644350436f756e74203c20696e7075744c656e67746829207b0a0a0909092f2f20416c6c206e6f6e2d626173696320636f646520706f696e7473203c206e2068617665206265656e2068616e646c656420616c72656164792e2046696e6420746865206e6578740a0909092f2f206c6172676572206f6e653a0a090909666f7220286d203d206d6178496e742c206a203d20303b206a203c20696e7075744c656e6774683b202b2b6a29207b0a0909090963757272656e7456616c7565203d20696e7075745b6a5d3b0a090909096966202863757272656e7456616c7565203e3d206e2026262063757272656e7456616c7565203c206d29207b0a09090909096d203d2063757272656e7456616c75653b0a090909097d0a0909097d0a0a0909092f2f20496e637265617365206064656c74616020656e6f75676820746f20616476616e636520746865206465636f6465722773203c6e2c693e20737461746520746f203c6d2c303e2c0a0909092f2f2062757420677561726420616761696e7374206f766572666c6f770a09090968616e646c65644350436f756e74506c75734f6e65203d2068616e646c65644350436f756e74202b20313b0a090909696620286d202d206e203e20666c6f6f7228286d6178496e74202d2064656c746129202f2068616e646c65644350436f756e74506c75734f6e652929207b0a090909096572726f7228276f766572666c6f7727293b0a0909097d0a0a09090964656c7461202b3d20286d202d206e29202a2068616e646c65644350436f756e74506c75734f6e653b0a0909096e203d206d3b0a0a090909666f7220286a203d20303b206a203c20696e7075744c656e6774683b202b2b6a29207b0a0909090963757272656e7456616c7565203d20696e7075745b6a5d3b0a0a090909096966202863757272656e7456616c7565203c206e202626202b2b64656c7461203e206d6178496e7429207b0a09090909096572726f7228276f766572666c6f7727293b0a090909097d0a0a090909096966202863757272656e7456616c7565203d3d206e29207b0a09090909092f2f20526570726573656e742064656c746120617320612067656e6572616c697a6564207661726961626c652d6c656e67746820696e74656765720a0909090909666f72202871203d2064656c74612c206b203d20626173653b202f2a206e6f20636f6e646974696f6e202a2f3b206b202b3d206261736529207b0a09090909090974203d206b203c3d2062696173203f20744d696e203a20286b203e3d2062696173202b20744d6178203f20744d6178203a206b202d2062696173293b0a0909090909096966202871203c207429207b0a09090909090909627265616b3b0a0909090909097d0a090909090909714d696e757354203d2071202d20743b0a090909090909626173654d696e757354203d2062617365202d20743b0a0909090909096f75747075742e70757368280a09090909090909737472696e6746726f6d43686172436f6465286469676974546f42617369632874202b20714d696e757354202520626173654d696e7573542c203029290a090909090909293b0a09090909090971203d20666c6f6f7228714d696e757354202f20626173654d696e757354293b0a09090909097d0a0a09090909096f75747075742e7075736828737472696e6746726f6d43686172436f6465286469676974546f426173696328712c20302929293b0a090909090962696173203d2061646170742864656c74612c2068616e646c65644350436f756e74506c75734f6e652c2068616e646c65644350436f756e74203d3d2062617369634c656e677468293b0a090909090964656c7461203d20303b0a09090909092b2b68616e646c65644350436f756e743b0a090909097d0a0909097d0a0a0909092b2b64656c74613b0a0909092b2b6e3b0a0a09097d0a090972657475726e206f75747075742e6a6f696e282727293b0a097d0a0a092f2a2a0a09202a20436f6e766572747320612050756e79636f646520737472696e6720726570726573656e74696e67206120646f6d61696e206e616d65206f7220616e20656d61696c20616464726573730a09202a20746f20556e69636f64652e204f6e6c79207468652050756e79636f646564207061727473206f662074686520696e7075742077696c6c20626520636f6e7665727465642c20692e652e0a09202a20697420646f65736e2774206d617474657220696620796f752063616c6c206974206f6e206120737472696e6720746861742068617320616c7265616479206265656e0a09202a20636f6e76657274656420746f20556e69636f64652e0a09202a20406d656d6265724f662070756e79636f64650a09202a2040706172616d207b537472696e677d20696e707574205468652050756e79636f64656420646f6d61696e206e616d65206f7220656d61696c206164647265737320746f0a09202a20636f6e7665727420746f20556e69636f64652e0a09202a204072657475726e73207b537472696e677d2054686520556e69636f646520726570726573656e746174696f6e206f662074686520676976656e2050756e79636f64650a09202a20737472696e672e0a09202a2f0a0966756e6374696f6e20746f556e69636f646528696e70757429207b0a090972657475726e206d6170446f6d61696e28696e7075742c2066756e6374696f6e28737472696e6729207b0a09090972657475726e20726567657850756e79636f64652e7465737428737472696e67290a090909093f206465636f646528737472696e672e736c6963652834292e746f4c6f776572436173652829290a090909093a20737472696e673b0a09097d293b0a097d0a0a092f2a2a0a09202a20436f6e7665727473206120556e69636f646520737472696e6720726570726573656e74696e67206120646f6d61696e206e616d65206f7220616e20656d61696c206164647265737320746f0a09202a2050756e79636f64652e204f6e6c7920746865206e6f6e2d4153434949207061727473206f662074686520646f6d61696e206e616d652077696c6c20626520636f6e7665727465642c0a09202a20692e652e20697420646f65736e2774206d617474657220696620796f752063616c6c2069742077697468206120646f6d61696e2074686174277320616c726561647920696e0a09202a2041534349492e0a09202a20406d656d6265724f662070756e79636f64650a09202a2040706172616d207b537472696e677d20696e7075742054686520646f6d61696e206e616d65206f7220656d61696c206164647265737320746f20636f6e766572742c20617320610a09202a20556e69636f646520737472696e672e0a09202a204072657475726e73207b537472696e677d205468652050756e79636f646520726570726573656e746174696f6e206f662074686520676976656e20646f6d61696e206e616d65206f720a09202a20656d61696c20616464726573732e0a09202a2f0a0966756e6374696f6e20746f415343494928696e70757429207b0a090972657475726e206d6170446f6d61696e28696e7075742c2066756e6374696f6e28737472696e6729207b0a09090972657475726e2072656765784e6f6e41534349492e7465737428737472696e67290a090909093f2027786e2d2d27202b20656e636f646528737472696e67290a090909093a20737472696e673b0a09097d293b0a097d0a0a092f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a0a092f2a2a20446566696e6520746865207075626c696320415049202a2f0a0970756e79636f6465203d207b0a09092f2a2a0a0909202a204120737472696e6720726570726573656e74696e67207468652063757272656e742050756e79636f64652e6a732076657273696f6e206e756d6265722e0a0909202a20406d656d6265724f662070756e79636f64650a0909202a20407479706520537472696e670a0909202a2f0a09092776657273696f6e273a2027312e332e32272c0a09092f2a2a0a0909202a20416e206f626a656374206f66206d6574686f647320746f20636f6e766572742066726f6d204a617661536372697074277320696e7465726e616c206368617261637465720a0909202a20726570726573656e746174696f6e20285543532d322920746f20556e69636f646520636f646520706f696e74732c20616e64206261636b2e0a0909202a2040736565203c68747470733a2f2f6d61746869617362796e656e732e62652f6e6f7465732f6a6176617363726970742d656e636f64696e673e0a0909202a20406d656d6265724f662070756e79636f64650a0909202a204074797065204f626a6563740a0909202a2f0a09092775637332273a207b0a090909276465636f6465273a20756373326465636f64652c0a09090927656e636f6465273a2075637332656e636f64650a09097d2c0a0909276465636f6465273a206465636f64652c0a090927656e636f6465273a20656e636f64652c0a090927746f4153434949273a20746f41534349492c0a090927746f556e69636f6465273a20746f556e69636f64650a097d3b0a0a092f2a2a204578706f7365206070756e79636f646560202a2f0a092f2f20536f6d6520414d44206275696c64206f7074696d697a6572732c206c696b6520722e6a732c20636865636b20666f7220737065636966696320636f6e646974696f6e207061747465726e730a092f2f206c696b652074686520666f6c6c6f77696e673a0a09696620280a0909747970656f6620646566696e65203d3d202766756e6374696f6e272026260a0909747970656f6620646566696e652e616d64203d3d20276f626a656374272026260a0909646566696e652e616d640a0929207b0a0909646566696e65282770756e79636f6465272c2066756e6374696f6e2829207b0a09090972657475726e2070756e79636f64653b0a09097d293b0a097d20656c73652069662028667265654578706f72747320262620667265654d6f64756c6529207b0a0909696620286d6f64756c652e6578706f727473203d3d20667265654578706f72747329207b202f2f20696e204e6f64652e6a73206f722052696e676f4a532076302e382e302b0a090909667265654d6f64756c652e6578706f727473203d2070756e79636f64653b0a09097d20656c7365207b202f2f20696e204e61727768616c206f722052696e676f4a532076302e372e302d0a090909666f7220286b657920696e2070756e79636f646529207b0a0909090970756e79636f64652e6861734f776e50726f7065727479286b6579292026262028667265654578706f7274735b6b65795d203d2070756e79636f64655b6b65795d293b0a0909097d0a09097d0a097d20656c7365207b202f2f20696e205268696e6f206f722061207765622062726f777365720a0909726f6f742e70756e79636f6465203d2070756e79636f64653b0a097d0a0a7d28636f6d6d6f6e6a73476c6f62616c29293b0a7d293b0a0a7661722070756e79636f64652431203d20696e7465726f7044656661756c742870756e79636f6465293b0a0a0a76617220726571756972652424322431203d204f626a6563742e667265657a65287b0a0964656661756c743a2070756e79636f646524310a7d293b0a0a766172207574696c203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2775736520737472696374273b0a0a6d6f64756c652e6578706f727473203d207b0a20206973537472696e673a2066756e6374696f6e2861726729207b0a2020202072657475726e20747970656f662861726729203d3d3d2027737472696e67273b0a20207d2c0a202069734f626a6563743a2066756e6374696f6e2861726729207b0a2020202072657475726e20747970656f662861726729203d3d3d20276f626a656374272026262061726720213d3d206e756c6c3b0a20207d2c0a202069734e756c6c3a2066756e6374696f6e2861726729207b0a2020202072657475726e20617267203d3d3d206e756c6c3b0a20207d2c0a202069734e756c6c4f72556e646566696e65643a2066756e6374696f6e2861726729207b0a2020202072657475726e20617267203d3d206e756c6c3b0a20207d0a7d3b0a7d293b0a0a766172207574696c2431203d20696e7465726f7044656661756c74287574696c293b0a766172206973537472696e67203d207574696c2e6973537472696e673b0a7661722069734f626a656374203d207574696c2e69734f626a6563743b0a7661722069734e756c6c203d207574696c2e69734e756c6c3b0a7661722069734e756c6c4f72556e646566696e6564203d207574696c2e69734e756c6c4f72556e646566696e65643b0a0a76617220726571756972652424312432203d204f626a6563742e667265657a65287b0a202064656661756c743a207574696c24312c0a20206973537472696e673a206973537472696e672c0a202069734f626a6563743a2069734f626a6563742c0a202069734e756c6c3a2069734e756c6c2c0a202069734e756c6c4f72556e646566696e65643a2069734e756c6c4f72556e646566696e65640a7d293b0a0a766172206465636f64652431203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2f2f20436f70797269676874204a6f79656e742c20496e632e20616e64206f74686572204e6f646520636f6e7472696275746f72732e0a2f2f0a2f2f205065726d697373696f6e20697320686572656279206772616e7465642c2066726565206f66206368617267652c20746f20616e7920706572736f6e206f627461696e696e6720610a2f2f20636f7079206f66207468697320736f66747761726520616e64206173736f63696174656420646f63756d656e746174696f6e2066696c657320287468650a2f2f2022536f66747761726522292c20746f206465616c20696e2074686520536f66747761726520776974686f7574207265737472696374696f6e2c20696e636c7564696e670a2f2f20776974686f7574206c696d69746174696f6e207468652072696768747320746f207573652c20636f70792c206d6f646966792c206d657267652c207075626c6973682c0a2f2f20646973747269627574652c207375626c6963656e73652c20616e642f6f722073656c6c20636f70696573206f662074686520536f6674776172652c20616e6420746f207065726d69740a2f2f20706572736f6e7320746f2077686f6d2074686520536f667477617265206973206675726e697368656420746f20646f20736f2c207375626a65637420746f207468650a2f2f20666f6c6c6f77696e6720636f6e646974696f6e733a0a2f2f0a2f2f205468652061626f766520636f70797269676874206e6f7469636520616e642074686973207065726d697373696f6e206e6f74696365207368616c6c20626520696e636c756465640a2f2f20696e20616c6c20636f70696573206f72207375627374616e7469616c20706f7274696f6e73206f662074686520536f6674776172652e0a2f2f0a2f2f2054484520534f4654574152452049532050524f564944454420224153204953222c20574954484f55542057415252414e5459204f4620414e59204b494e442c20455850524553530a2f2f204f5220494d504c4945442c20494e434c5544494e4720425554204e4f54204c494d4954454420544f205448452057415252414e54494553204f460a2f2f204d45524348414e544142494c4954592c204649544e45535320464f52204120504152544943554c415220505552504f534520414e44204e4f4e494e4652494e47454d454e542e20494e0a2f2f204e4f204556454e54205348414c4c2054484520415554484f5253204f5220434f5059524947485420484f4c44455253204245204c4941424c4520464f5220414e5920434c41494d2c0a2f2f2044414d41474553204f52204f54484552204c494142494c4954592c205748455448455220494e20414e20414354494f4e204f4620434f4e54524143542c20544f5254204f520a2f2f204f54484552574953452c2041524953494e472046524f4d2c204f5554204f46204f5220494e20434f4e4e454354494f4e20574954482054484520534f465457415245204f52205448450a2f2f20555345204f52204f54484552204445414c494e475320494e2054484520534f4654574152452e0a0a2775736520737472696374273b0a0a2f2f204966206f626a2e6861734f776e50726f706572747920686173206265656e206f76657272696464656e2c207468656e2063616c6c696e670a2f2f206f626a2e6861734f776e50726f70657274792870726f70292077696c6c20627265616b2e0a2f2f205365653a2068747470733a2f2f6769746875622e636f6d2f6a6f79656e742f6e6f64652f6973737565732f313730370a66756e6374696f6e206861734f776e50726f7065727479286f626a2c2070726f7029207b0a202072657475726e204f626a6563742e70726f746f747970652e6861734f776e50726f70657274792e63616c6c286f626a2c2070726f70293b0a7d0a0a6d6f64756c652e6578706f727473203d2066756e6374696f6e2871732c207365702c2065712c206f7074696f6e7329207b0a2020736570203d20736570207c7c202726273b0a20206571203d206571207c7c20273d273b0a2020766172206f626a203d207b7d3b0a0a202069662028747970656f6620717320213d3d2027737472696e6727207c7c2071732e6c656e677468203d3d3d203029207b0a2020202072657475726e206f626a3b0a20207d0a0a202076617220726567657870203d202f5c2b2f673b0a20207173203d2071732e73706c697428736570293b0a0a2020766172206d61784b657973203d20313030303b0a2020696620286f7074696f6e7320262620747970656f66206f7074696f6e732e6d61784b657973203d3d3d20276e756d6265722729207b0a202020206d61784b657973203d206f7074696f6e732e6d61784b6579733b0a20207d0a0a2020766172206c656e203d2071732e6c656e6774683b0a20202f2f206d61784b657973203c3d2030206d65616e7320746861742077652073686f756c64206e6f74206c696d6974206b65797320636f756e740a2020696620286d61784b657973203e2030202626206c656e203e206d61784b65797329207b0a202020206c656e203d206d61784b6579733b0a20207d0a0a2020666f7220287661722069203d20303b2069203c206c656e3b202b2b6929207b0a202020207661722078203d2071735b695d2e7265706c616365287265676578702c202725323027292c0a2020202020202020696478203d20782e696e6465784f66286571292c0a20202020202020206b7374722c20767374722c206b2c20763b0a0a2020202069662028696478203e3d203029207b0a2020202020206b737472203d20782e73756273747228302c20696478293b0a20202020202076737472203d20782e73756273747228696478202b2031293b0a202020207d20656c7365207b0a2020202020206b737472203d20783b0a20202020202076737472203d2027273b0a202020207d0a0a202020206b203d206465636f6465555249436f6d706f6e656e74286b737472293b0a2020202076203d206465636f6465555249436f6d706f6e656e742876737472293b0a0a2020202069662028216861734f776e50726f7065727479286f626a2c206b2929207b0a2020202020206f626a5b6b5d203d20763b0a202020207d20656c7365206966202841727261792e69734172726179286f626a5b6b5d2929207b0a2020202020206f626a5b6b5d2e707573682876293b0a202020207d20656c7365207b0a2020202020206f626a5b6b5d203d205b6f626a5b6b5d2c20765d3b0a202020207d0a20207d0a0a202072657475726e206f626a3b0a7d3b0a7d293b0a0a766172206465636f64652432203d20696e7465726f7044656661756c74286465636f64652431293b0a0a0a76617220726571756972652424312433203d204f626a6563742e667265657a65287b0a202064656661756c743a206465636f646524320a7d293b0a0a76617220656e636f64652431203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a2f2f20436f70797269676874204a6f79656e742c20496e632e20616e64206f74686572204e6f646520636f6e7472696275746f72732e0a2f2f0a2f2f205065726d697373696f6e20697320686572656279206772616e7465642c2066726565206f66206368617267652c20746f20616e7920706572736f6e206f627461696e696e6720610a2f2f20636f7079206f66207468697320736f66747761726520616e64206173736f63696174656420646f63756d656e746174696f6e2066696c657320287468650a2f2f2022536f66747761726522292c20746f206465616c20696e2074686520536f66747761726520776974686f7574207265737472696374696f6e2c20696e636c7564696e670a2f2f20776974686f7574206c696d69746174696f6e207468652072696768747320746f207573652c20636f70792c206d6f646966792c206d657267652c207075626c6973682c0a2f2f20646973747269627574652c207375626c6963656e73652c20616e642f6f722073656c6c20636f70696573206f662074686520536f6674776172652c20616e6420746f207065726d69740a2f2f20706572736f6e7320746f2077686f6d2074686520536f667477617265206973206675726e697368656420746f20646f20736f2c207375626a65637420746f207468650a2f2f20666f6c6c6f77696e6720636f6e646974696f6e733a0a2f2f0a2f2f205468652061626f766520636f70797269676874206e6f7469636520616e642074686973207065726d697373696f6e206e6f74696365207368616c6c20626520696e636c756465640a2f2f20696e20616c6c20636f70696573206f72207375627374616e7469616c20706f7274696f6e73206f662074686520536f6674776172652e0a2f2f0a2f2f2054484520534f4654574152452049532050524f564944454420224153204953222c20574954484f55542057415252414e5459204f4620414e59204b494e442c20455850524553530a2f2f204f5220494d504c4945442c20494e434c5544494e4720425554204e4f54204c494d4954454420544f205448452057415252414e54494553204f460a2f2f204d45524348414e544142494c4954592c204649544e45535320464f52204120504152544943554c415220505552504f534520414e44204e4f4e494e4652494e47454d454e542e20494e0a2f2f204e4f204556454e54205348414c4c2054484520415554484f5253204f5220434f5059524947485420484f4c44455253204245204c4941424c4520464f5220414e5920434c41494d2c0a2f2f2044414d41474553204f52204f54484552204c494142494c4954592c205748455448455220494e20414e20414354494f4e204f4620434f4e54524143542c20544f5254204f520a2f2f204f54484552574953452c2041524953494e472046524f4d2c204f5554204f46204f5220494e20434f4e4e454354494f4e20574954482054484520534f465457415245204f52205448450a2f2f20555345204f52204f54484552204445414c494e475320494e2054484520534f4654574152452e0a0a2775736520737472696374273b0a0a76617220737472696e676966795072696d6974697665203d2066756e6374696f6e287629207b0a20207377697463682028747970656f66207629207b0a20202020636173652027737472696e67273a0a20202020202072657475726e20763b0a0a20202020636173652027626f6f6c65616e273a0a20202020202072657475726e2076203f20277472756527203a202766616c7365273b0a0a202020206361736520276e756d626572273a0a20202020202072657475726e20697346696e697465287629203f2076203a2027273b0a0a2020202064656661756c743a0a20202020202072657475726e2027273b0a20207d0a7d3b0a0a6d6f64756c652e6578706f727473203d2066756e6374696f6e286f626a2c207365702c2065712c206e616d6529207b0a2020736570203d20736570207c7c202726273b0a20206571203d206571207c7c20273d273b0a2020696620286f626a203d3d3d206e756c6c29207b0a202020206f626a203d20756e646566696e65643b0a20207d0a0a202069662028747970656f66206f626a203d3d3d20276f626a6563742729207b0a2020202072657475726e204f626a6563742e6b657973286f626a292e6d61702866756e6374696f6e286b29207b0a202020202020766172206b73203d20656e636f6465555249436f6d706f6e656e7428737472696e676966795072696d6974697665286b2929202b2065713b0a2020202020206966202841727261792e69734172726179286f626a5b6b5d2929207b0a202020202020202072657475726e206f626a5b6b5d2e6d61702866756e6374696f6e287629207b0a2020202020202020202072657475726e206b73202b20656e636f6465555249436f6d706f6e656e7428737472696e676966795072696d6974697665287629293b0a20202020202020207d292e6a6f696e28736570293b0a2020202020207d20656c7365207b0a202020202020202072657475726e206b73202b20656e636f6465555249436f6d706f6e656e7428737472696e676966795072696d6974697665286f626a5b6b5d29293b0a2020202020207d0a202020207d292e6a6f696e28736570293b0a0a20207d0a0a202069662028216e616d65292072657475726e2027273b0a202072657475726e20656e636f6465555249436f6d706f6e656e7428737472696e676966795072696d6974697665286e616d652929202b206571202b0a202020202020202020656e636f6465555249436f6d706f6e656e7428737472696e676966795072696d6974697665286f626a29293b0a7d3b0a7d293b0a0a76617220656e636f64652432203d20696e7465726f7044656661756c7428656e636f64652431293b0a0a0a76617220726571756972652424302435203d204f626a6563742e667265657a65287b0a202064656661756c743a20656e636f646524320a7d293b0a0a76617220696e6465782431203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c652c206578706f72747329207b0a2775736520737472696374273b0a0a6578706f7274732e6465636f6465203d206578706f7274732e7061727365203d20696e7465726f7044656661756c7428726571756972652424312433293b0a6578706f7274732e656e636f6465203d206578706f7274732e737472696e67696679203d20696e7465726f7044656661756c7428726571756972652424302435293b0a7d293b0a0a76617220696e6465782432203d20696e7465726f7044656661756c7428696e6465782431293b0a76617220656e636f6465203d20696e64657824312e656e636f64653b0a76617220737472696e67696679203d20696e64657824312e737472696e676966793b0a766172206465636f6465203d20696e64657824312e6465636f64653b0a7661722070617273652432203d20696e64657824312e70617273653b0a0a76617220726571756972652424302434203d204f626a6563742e667265657a65287b0a0964656661756c743a20696e64657824322c0a09656e636f64653a20656e636f64652c0a09737472696e676966793a20737472696e676966792c0a096465636f64653a206465636f64652c0a0970617273653a20706172736524320a7d293b0a0a7661722075726c203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c652c206578706f72747329207b0a2f2f20436f70797269676874204a6f79656e742c20496e632e20616e64206f74686572204e6f646520636f6e7472696275746f72732e0a2f2f0a2f2f205065726d697373696f6e20697320686572656279206772616e7465642c2066726565206f66206368617267652c20746f20616e7920706572736f6e206f627461696e696e6720610a2f2f20636f7079206f66207468697320736f66747761726520616e64206173736f63696174656420646f63756d656e746174696f6e2066696c657320287468650a2f2f2022536f66747761726522292c20746f206465616c20696e2074686520536f66747761726520776974686f7574207265737472696374696f6e2c20696e636c7564696e670a2f2f20776974686f7574206c696d69746174696f6e207468652072696768747320746f207573652c20636f70792c206d6f646966792c206d657267652c207075626c6973682c0a2f2f20646973747269627574652c207375626c6963656e73652c20616e642f6f722073656c6c20636f70696573206f662074686520536f6674776172652c20616e6420746f207065726d69740a2f2f20706572736f6e7320746f2077686f6d2074686520536f667477617265206973206675726e697368656420746f20646f20736f2c207375626a65637420746f207468650a2f2f20666f6c6c6f77696e6720636f6e646974696f6e733a0a2f2f0a2f2f205468652061626f766520636f70797269676874206e6f7469636520616e642074686973207065726d697373696f6e206e6f74696365207368616c6c20626520696e636c756465640a2f2f20696e20616c6c20636f70696573206f72207375627374616e7469616c20706f7274696f6e73206f662074686520536f6674776172652e0a2f2f0a2f2f2054484520534f4654574152452049532050524f564944454420224153204953222c20574954484f55542057415252414e5459204f4620414e59204b494e442c20455850524553530a2f2f204f5220494d504c4945442c20494e434c5544494e4720425554204e4f54204c494d4954454420544f205448452057415252414e54494553204f460a2f2f204d45524348414e544142494c4954592c204649544e45535320464f52204120504152544943554c415220505552504f534520414e44204e4f4e494e4652494e47454d454e542e20494e0a2f2f204e4f204556454e54205348414c4c2054484520415554484f5253204f5220434f5059524947485420484f4c44455253204245204c4941424c4520464f5220414e5920434c41494d2c0a2f2f2044414d41474553204f52204f54484552204c494142494c4954592c205748455448455220494e20414e20414354494f4e204f4620434f4e54524143542c20544f5254204f520a2f2f204f54484552574953452c2041524953494e472046524f4d2c204f5554204f46204f5220494e20434f4e4e454354494f4e20574954482054484520534f465457415245204f52205448450a2f2f20555345204f52204f54484552204445414c494e475320494e2054484520534f4654574152452e0a0a2775736520737472696374273b0a0a7661722070756e79636f6465203d20696e7465726f7044656661756c7428726571756972652424322431293b0a766172207574696c203d20696e7465726f7044656661756c7428726571756972652424312432293b0a0a6578706f7274732e7061727365203d2075726c50617273653b0a6578706f7274732e7265736f6c7665203d2075726c5265736f6c76653b0a6578706f7274732e7265736f6c76654f626a656374203d2075726c5265736f6c76654f626a6563743b0a6578706f7274732e666f726d6174203d2075726c466f726d61743b0a0a6578706f7274732e55726c203d2055726c3b0a0a66756e6374696f6e2055726c2829207b0a2020746869732e70726f746f636f6c203d206e756c6c3b0a2020746869732e736c6173686573203d206e756c6c3b0a2020746869732e61757468203d206e756c6c3b0a2020746869732e686f7374203d206e756c6c3b0a2020746869732e706f7274203d206e756c6c3b0a2020746869732e686f73746e616d65203d206e756c6c3b0a2020746869732e68617368203d206e756c6c3b0a2020746869732e736561726368203d206e756c6c3b0a2020746869732e7175657279203d206e756c6c3b0a2020746869732e706174686e616d65203d206e756c6c3b0a2020746869732e70617468203d206e756c6c3b0a2020746869732e68726566203d206e756c6c3b0a7d0a0a2f2f205265666572656e63653a2052464320333938362c2052464320313830382c2052464320323339360a0a2f2f20646566696e65207468657365206865726520736f206174206c656173742074686579206f6e6c79206861766520746f2062650a2f2f20636f6d70696c6564206f6e6365206f6e20746865206669727374206d6f64756c65206c6f61642e0a7661722070726f746f636f6c5061747465726e203d202f5e285b612d7a302d392e2b2d5d2b3a292f692c0a20202020706f72745061747465726e203d202f3a5b302d395d2a242f2c0a0a202020202f2f205370656369616c206361736520666f7220612073696d706c6520706174682055524c0a2020202073696d706c65506174685061747465726e203d202f5e285c2f5c2f3f283f215c2f295b5e5c3f5c735d2a29285c3f5b5e5c735d2a293f242f2c0a0a202020202f2f2052464320323339363a206368617261637465727320726573657276656420666f722064656c696d6974696e672055524c732e0a202020202f2f2057652061637475616c6c79206a757374206175746f2d6573636170652074686573652e0a2020202064656c696d73203d205b273c272c20273e272c202722272c202760272c202720272c20275c72272c20275c6e272c20275c74275d2c0a0a202020202f2f2052464320323339363a2063686172616374657273206e6f7420616c6c6f77656420666f7220766172696f757320726561736f6e732e0a20202020756e77697365203d205b277b272c20277d272c20277c272c20275c5c272c20275e272c202760275d2e636f6e6361742864656c696d73292c0a0a202020202f2f20416c6c6f77656420627920524643732c20627574206361757365206f66205853532061747461636b732e2020416c77617973206573636170652074686573652e0a202020206175746f457363617065203d205b275c27275d2e636f6e63617428756e77697365292c0a202020202f2f2043686172616374657273207468617420617265206e65766572206576657220616c6c6f77656420696e206120686f73746e616d652e0a202020202f2f204e6f7465207468617420616e7920696e76616c69642063686172732061726520616c736f2068616e646c65642c206275742074686573650a202020202f2f2061726520746865206f6e6573207468617420617265202a65787065637465642a20746f206265207365656e2c20736f20776520666173742d706174680a202020202f2f207468656d2e0a202020206e6f6e486f73744368617273203d205b2725272c20272f272c20273f272c20273b272c202723275d2e636f6e636174286175746f457363617065292c0a20202020686f7374456e64696e674368617273203d205b272f272c20273f272c202723275d2c0a20202020686f73746e616d654d61784c656e203d203235352c0a20202020686f73746e616d65506172745061747465726e203d202f5e5b2b612d7a302d39412d5a5f2d5d7b302c36337d242f2c0a20202020686f73746e616d65506172745374617274203d202f5e285b2b612d7a302d39412d5a5f2d5d7b302c36337d29282e2a29242f2c0a202020202f2f2070726f746f636f6c7320746861742063616e20616c6c6f772022756e736166652220616e642022756e77697365222063686172732e0a20202020756e7361666550726f746f636f6c203d207b0a202020202020276a617661736372697074273a20747275652c0a202020202020276a6176617363726970743a273a20747275650a202020207d2c0a202020202f2f2070726f746f636f6c732074686174206e657665722068617665206120686f73746e616d652e0a20202020686f73746c65737350726f746f636f6c203d207b0a202020202020276a617661736372697074273a20747275652c0a202020202020276a6176617363726970743a273a20747275650a202020207d2c0a202020202f2f2070726f746f636f6c73207468617420616c7761797320636f6e7461696e2061202f2f206269742e0a20202020736c617368656450726f746f636f6c203d207b0a2020202020202768747470273a20747275652c0a202020202020276874747073273a20747275652c0a20202020202027667470273a20747275652c0a20202020202027676f70686572273a20747275652c0a2020202020202766696c65273a20747275652c0a20202020202027687474703a273a20747275652c0a2020202020202768747470733a273a20747275652c0a202020202020276674703a273a20747275652c0a20202020202027676f706865723a273a20747275652c0a2020202020202766696c653a273a20747275650a202020207d2c0a202020207175657279737472696e67203d20696e7465726f7044656661756c7428726571756972652424302434293b0a0a66756e6374696f6e2075726c50617273652875726c2c2070617273655175657279537472696e672c20736c617368657344656e6f7465486f737429207b0a20206966202875726c202626207574696c2e69734f626a6563742875726c292026262075726c20696e7374616e63656f662055726c292072657475726e2075726c3b0a0a20207661722075203d206e65772055726c3b0a2020752e70617273652875726c2c2070617273655175657279537472696e672c20736c617368657344656e6f7465486f7374293b0a202072657475726e20753b0a7d0a0a55726c2e70726f746f747970652e7061727365203d2066756e6374696f6e2875726c2c2070617273655175657279537472696e672c20736c617368657344656e6f7465486f737429207b0a202076617220746869732431203d20746869733b0a0a202069662028217574696c2e6973537472696e672875726c2929207b0a202020207468726f77206e657720547970654572726f722822506172616d65746572202775726c27206d757374206265206120737472696e672c206e6f742022202b20747970656f662075726c293b0a20207d0a0a20202f2f20436f7079206368726f6d652c2049452c206f70657261206261636b736c6173682d68616e646c696e67206265686176696f722e0a20202f2f204261636b20736c6173686573206265666f72652074686520717565727920737472696e672067657420636f6e76657274656420746f20666f727761726420736c61736865730a20202f2f205365653a2068747470733a2f2f636f64652e676f6f676c652e636f6d2f702f6368726f6d69756d2f6973737565732f64657461696c3f69643d32353931360a2020766172207175657279496e646578203d2075726c2e696e6465784f6628273f27292c0a20202020202073706c6974746572203d0a20202020202020202020287175657279496e64657820213d3d202d31202626207175657279496e646578203c2075726c2e696e6465784f66282723272929203f20273f27203a202723272c0a2020202020207553706c6974203d2075726c2e73706c69742873706c6974746572292c0a202020202020736c6173685265676578203d202f5c5c2f673b0a20207553706c69745b305d203d207553706c69745b305d2e7265706c61636528736c61736852656765782c20272f27293b0a202075726c203d207553706c69742e6a6f696e2873706c6974746572293b0a0a20207661722072657374203d2075726c3b0a0a20202f2f207472696d206265666f72652070726f63656564696e672e0a20202f2f205468697320697320746f20737570706f7274207061727365207374756666206c696b6520222020687474703a2f2f666f6f2e636f6d20205c6e220a202072657374203d20726573742e7472696d28293b0a0a20206966202821736c617368657344656e6f7465486f73742026262075726c2e73706c697428272327292e6c656e677468203d3d3d203129207b0a202020202f2f2054727920666173742070617468207265676578700a202020207661722073696d706c6550617468203d2073696d706c65506174685061747465726e2e657865632872657374293b0a202020206966202873696d706c655061746829207b0a202020202020746869732e70617468203d20726573743b0a202020202020746869732e68726566203d20726573743b0a202020202020746869732e706174686e616d65203d2073696d706c65506174685b315d3b0a2020202020206966202873696d706c65506174685b325d29207b0a2020202020202020746869732e736561726368203d2073696d706c65506174685b325d3b0a20202020202020206966202870617273655175657279537472696e6729207b0a20202020202020202020746869732e7175657279203d207175657279737472696e672e706172736528746869732e7365617263682e737562737472283129293b0a20202020202020207d20656c7365207b0a20202020202020202020746869732e7175657279203d20746869732e7365617263682e7375627374722831293b0a20202020202020207d0a2020202020207d20656c7365206966202870617273655175657279537472696e6729207b0a2020202020202020746869732e736561726368203d2027273b0a2020202020202020746869732e7175657279203d207b7d3b0a2020202020207d0a20202020202072657475726e20746869733b0a202020207d0a20207d0a0a20207661722070726f746f203d2070726f746f636f6c5061747465726e2e657865632872657374293b0a20206966202870726f746f29207b0a2020202070726f746f203d2070726f746f5b305d3b0a20202020766172206c6f77657250726f746f203d2070726f746f2e746f4c6f7765724361736528293b0a20202020746869732e70726f746f636f6c203d206c6f77657250726f746f3b0a2020202072657374203d20726573742e7375627374722870726f746f2e6c656e677468293b0a20207d0a0a20202f2f20666967757265206f7574206966206974277320676f74206120686f73740a20202f2f207573657240736572766572206973202a616c776179732a20696e746572707265746564206173206120686f73746e616d652c20616e642075726c0a20202f2f207265736f6c7574696f6e2077696c6c207472656174202f2f666f6f2f62617220617320686f73743d666f6f2c706174683d6261722062656361757365207468617427730a20202f2f20686f77207468652062726f77736572207265736f6c7665732072656c61746976652055524c732e0a202069662028736c617368657344656e6f7465486f7374207c7c2070726f746f207c7c20726573742e6d61746368282f5e5c2f5c2f5b5e405c2f5d2b405b5e405c2f5d2b2f2929207b0a2020202076617220736c6173686573203d20726573742e73756273747228302c203229203d3d3d20272f2f273b0a2020202069662028736c617368657320262620212870726f746f20262620686f73746c65737350726f746f636f6c5b70726f746f5d2929207b0a20202020202072657374203d20726573742e7375627374722832293b0a202020202020746869732e736c6173686573203d20747275653b0a202020207d0a20207d0a0a20206966202821686f73746c65737350726f746f636f6c5b70726f746f5d2026260a20202020202028736c6173686573207c7c202870726f746f2026262021736c617368656450726f746f636f6c5b70726f746f5d292929207b0a0a202020202f2f2074686572652773206120686f73746e616d652e0a202020202f2f2074686520666972737420696e7374616e6365206f66202f2c203f2c203b2c206f72202320656e64732074686520686f73742e0a202020202f2f0a202020202f2f20496620746865726520697320616e204020696e2074686520686f73746e616d652c207468656e206e6f6e2d686f7374206368617273202a6172652a20616c6c6f7765640a202020202f2f20746f20746865206c656674206f6620746865206c6173742040207369676e2c20756e6c65737320736f6d6520686f73742d656e64696e67206368617261637465720a202020202f2f20636f6d6573202a6265666f72652a2074686520402d7369676e2e0a202020202f2f2055524c7320617265206f626e6f78696f75732e0a202020202f2f0a202020202f2f2065783a0a202020202f2f20687474703a2f2f61406240632f203d3e20757365723a61406220686f73743a630a202020202f2f20687474703a2f2f6140623f4063203d3e20757365723a6120686f73743a6320706174683a2f3f40630a0a202020202f2f2076302e313220544f444f28697361616373293a2054686973206973206e6f7420717569746520686f77204368726f6d6520646f6573207468696e67732e0a202020202f2f20526576696577206f75722074657374206361736520616761696e73742062726f7773657273206d6f726520636f6d70726568656e736976656c792e0a0a202020202f2f2066696e642074686520666972737420696e7374616e6365206f6620616e7920686f7374456e64696e6743686172730a2020202076617220686f7374456e64203d202d313b0a20202020666f7220287661722069203d20303b2069203c20686f7374456e64696e6743686172732e6c656e6774683b20692b2b29207b0a20202020202076617220686563203d20726573742e696e6465784f6628686f7374456e64696e6743686172735b695d293b0a2020202020206966202868656320213d3d202d312026262028686f7374456e64203d3d3d202d31207c7c20686563203c20686f7374456e6429290a2020202020202020686f7374456e64203d206865633b0a202020207d0a0a202020202f2f206174207468697320706f696e742c20656974686572207765206861766520616e206578706c6963697420706f696e74207768657265207468650a202020202f2f206175746820706f7274696f6e2063616e6e6f7420676f20706173742c206f7220746865206c617374204020636861722069732074686520646563696465722e0a2020202076617220617574682c2061745369676e3b0a2020202069662028686f7374456e64203d3d3d202d3129207b0a2020202020202f2f2061745369676e2063616e20626520616e7977686572652e0a20202020202061745369676e203d20726573742e6c617374496e6465784f6628274027293b0a202020207d20656c7365207b0a2020202020202f2f2061745369676e206d75737420626520696e206175746820706f7274696f6e2e0a2020202020202f2f20687474703a2f2f6140622f634064203d3e20686f73743a6220617574683a6120706174683a2f6340640a20202020202061745369676e203d20726573742e6c617374496e6465784f66282740272c20686f7374456e64293b0a202020207d0a0a202020202f2f204e6f772077652068617665206120706f7274696f6e20776869636820697320646566696e6974656c792074686520617574682e0a202020202f2f2050756c6c2074686174206f66662e0a202020206966202861745369676e20213d3d202d3129207b0a20202020202061757468203d20726573742e736c69636528302c2061745369676e293b0a20202020202072657374203d20726573742e736c6963652861745369676e202b2031293b0a202020202020746869732e61757468203d206465636f6465555249436f6d706f6e656e742861757468293b0a202020207d0a0a202020202f2f2074686520686f7374206973207468652072656d61696e696e6720746f20746865206c656674206f6620746865206669727374206e6f6e2d686f737420636861720a20202020686f7374456e64203d202d313b0a20202020666f7220287661722069203d20303b2069203c206e6f6e486f737443686172732e6c656e6774683b20692b2b29207b0a20202020202076617220686563203d20726573742e696e6465784f66286e6f6e486f737443686172735b695d293b0a2020202020206966202868656320213d3d202d312026262028686f7374456e64203d3d3d202d31207c7c20686563203c20686f7374456e6429290a2020202020202020686f7374456e64203d206865633b0a202020207d0a202020202f2f206966207765207374696c6c2068617665206e6f74206869742069742c207468656e2074686520656e74697265207468696e67206973206120686f73742e0a2020202069662028686f7374456e64203d3d3d202d31290a202020202020686f7374456e64203d20726573742e6c656e6774683b0a0a20202020746869732e686f7374203d20726573742e736c69636528302c20686f7374456e64293b0a2020202072657374203d20726573742e736c69636528686f7374456e64293b0a0a202020202f2f2070756c6c206f757420706f72742e0a20202020746869732e7061727365486f737428293b0a0a202020202f2f20776527766520696e646963617465642074686174207468657265206973206120686f73746e616d652c0a202020202f2f20736f206576656e206966206974277320656d7074792c2069742068617320746f2062652070726573656e742e0a20202020746869732e686f73746e616d65203d20746869732e686f73746e616d65207c7c2027273b0a0a202020202f2f20696620686f73746e616d6520626567696e732077697468205b20616e6420656e64732077697468205d0a202020202f2f20617373756d652074686174206974277320616e204950763620616464726573732e0a202020207661722069707636486f73746e616d65203d20746869732e686f73746e616d655b305d203d3d3d20275b272026260a2020202020202020746869732e686f73746e616d655b746869732e686f73746e616d652e6c656e677468202d20315d203d3d3d20275d273b0a0a202020202f2f2076616c69646174652061206c6974746c652e0a20202020696620282169707636486f73746e616d6529207b0a20202020202076617220686f73747061727473203d20746869732e686f73746e616d652e73706c6974282f5c2e2f293b0a202020202020666f7220287661722069203d20302c206c203d20686f737470617274732e6c656e6774683b2069203c206c3b20692b2b29207b0a20202020202020207661722070617274203d20686f737470617274735b695d3b0a20202020202020206966202821706172742920636f6e74696e75653b0a20202020202020206966202821706172742e6d6174636828686f73746e616d65506172745061747465726e2929207b0a20202020202020202020766172206e657770617274203d2027273b0a20202020202020202020666f722028766172206a203d20302c206b203d20706172742e6c656e6774683b206a203c206b3b206a2b2b29207b0a20202020202020202020202069662028706172742e63686172436f64654174286a29203e2031323729207b0a20202020202020202020202020202f2f207765207265706c616365206e6f6e2d41534349492063686172207769746820612074656d706f7261727920706c616365686f6c6465720a20202020202020202020202020202f2f207765206e656564207468697320746f206d616b6520737572652073697a65206f6620686f73746e616d65206973206e6f740a20202020202020202020202020202f2f2062726f6b656e206279207265706c6163696e67206e6f6e2d4153434949206279206e6f7468696e670a20202020202020202020202020206e657770617274202b3d202778273b0a2020202020202020202020207d20656c7365207b0a20202020202020202020202020206e657770617274202b3d20706172745b6a5d3b0a2020202020202020202020207d0a202020202020202020207d0a202020202020202020202f2f207765207465737420616761696e20776974682041534349492063686172206f6e6c790a2020202020202020202069662028216e6577706172742e6d6174636828686f73746e616d65506172745061747465726e2929207b0a2020202020202020202020207661722076616c69645061727473203d20686f737470617274732e736c69636528302c2069293b0a202020202020202020202020766172206e6f74486f7374203d20686f737470617274732e736c6963652869202b2031293b0a20202020202020202020202076617220626974203d20706172742e6d6174636828686f73746e616d65506172745374617274293b0a2020202020202020202020206966202862697429207b0a202020202020202020202020202076616c696450617274732e70757368286269745b315d293b0a20202020202020202020202020206e6f74486f73742e756e7368696674286269745b325d293b0a2020202020202020202020207d0a202020202020202020202020696620286e6f74486f73742e6c656e67746829207b0a202020202020202020202020202072657374203d20272f27202b206e6f74486f73742e6a6f696e28272e2729202b20726573743b0a2020202020202020202020207d0a2020202020202020202020207468697324312e686f73746e616d65203d2076616c696450617274732e6a6f696e28272e27293b0a202020202020202020202020627265616b3b0a202020202020202020207d0a20202020202020207d0a2020202020207d0a202020207d0a0a2020202069662028746869732e686f73746e616d652e6c656e677468203e20686f73746e616d654d61784c656e29207b0a202020202020746869732e686f73746e616d65203d2027273b0a202020207d20656c7365207b0a2020202020202f2f20686f73746e616d65732061726520616c77617973206c6f77657220636173652e0a202020202020746869732e686f73746e616d65203d20746869732e686f73746e616d652e746f4c6f7765724361736528293b0a202020207d0a0a20202020696620282169707636486f73746e616d6529207b0a2020202020202f2f2049444e4120537570706f72743a2052657475726e7320612070756e79636f64656420726570726573656e746174696f6e206f662022646f6d61696e222e0a2020202020202f2f204974206f6e6c7920636f6e7665727473207061727473206f662074686520646f6d61696e206e616d6520746861740a2020202020202f2f2068617665206e6f6e2d415343494920636861726163746572732c20692e652e20697420646f65736e2774206d61747465722069660a2020202020202f2f20796f752063616c6c2069742077697468206120646f6d61696e207468617420616c72656164792069732041534349492d6f6e6c792e0a202020202020746869732e686f73746e616d65203d2070756e79636f64652e746f415343494928746869732e686f73746e616d65293b0a202020207d0a0a202020207661722070203d20746869732e706f7274203f20273a27202b20746869732e706f7274203a2027273b0a202020207661722068203d20746869732e686f73746e616d65207c7c2027273b0a20202020746869732e686f7374203d2068202b20703b0a20202020746869732e68726566202b3d20746869732e686f73743b0a0a202020202f2f207374726970205b20616e64205d2066726f6d2074686520686f73746e616d650a202020202f2f2074686520686f7374206669656c64207374696c6c2072657461696e73207468656d2c2074686f7567680a202020206966202869707636486f73746e616d6529207b0a202020202020746869732e686f73746e616d65203d20746869732e686f73746e616d652e73756273747228312c20746869732e686f73746e616d652e6c656e677468202d2032293b0a20202020202069662028726573745b305d20213d3d20272f2729207b0a202020202020202072657374203d20272f27202b20726573743b0a2020202020207d0a202020207d0a20207d0a0a20202f2f206e6f7720726573742069732073657420746f2074686520706f73742d686f73742073747566662e0a20202f2f2063686f70206f666620616e792064656c696d2063686172732e0a20206966202821756e7361666550726f746f636f6c5b6c6f77657250726f746f5d29207b0a0a202020202f2f2046697273742c206d616b6520313030252073757265207468617420616e7920226175746f45736361706522206368617273206765740a202020202f2f20657363617065642c206576656e20696620656e636f6465555249436f6d706f6e656e7420646f65736e2774207468696e6b20746865790a202020202f2f206e65656420746f2062652e0a20202020666f7220287661722069203d20302c206c203d206175746f4573636170652e6c656e6774683b2069203c206c3b20692b2b29207b0a202020202020766172206165203d206175746f4573636170655b695d3b0a20202020202069662028726573742e696e6465784f6628616529203d3d3d202d31290a2020202020202020636f6e74696e75653b0a20202020202076617220657363203d20656e636f6465555249436f6d706f6e656e74286165293b0a20202020202069662028657363203d3d3d20616529207b0a2020202020202020657363203d20657363617065286165293b0a2020202020207d0a20202020202072657374203d20726573742e73706c6974286165292e6a6f696e28657363293b0a202020207d0a20207d0a0a0a20202f2f2063686f70206f66662066726f6d20746865207461696c2066697273742e0a20207661722068617368203d20726573742e696e6465784f6628272327293b0a2020696620286861736820213d3d202d3129207b0a202020202f2f20676f74206120667261676d656e7420737472696e672e0a20202020746869732e68617368203d20726573742e7375627374722868617368293b0a2020202072657374203d20726573742e736c69636528302c2068617368293b0a20207d0a202076617220716d203d20726573742e696e6465784f6628273f27293b0a202069662028716d20213d3d202d3129207b0a20202020746869732e736561726368203d20726573742e73756273747228716d293b0a20202020746869732e7175657279203d20726573742e73756273747228716d202b2031293b0a202020206966202870617273655175657279537472696e6729207b0a202020202020746869732e7175657279203d207175657279737472696e672e706172736528746869732e7175657279293b0a202020207d0a2020202072657374203d20726573742e736c69636528302c20716d293b0a20207d20656c7365206966202870617273655175657279537472696e6729207b0a202020202f2f206e6f20717565727920737472696e672c206275742070617273655175657279537472696e67207374696c6c207265717565737465640a20202020746869732e736561726368203d2027273b0a20202020746869732e7175657279203d207b7d3b0a20207d0a202069662028726573742920746869732e706174686e616d65203d20726573743b0a202069662028736c617368656450726f746f636f6c5b6c6f77657250726f746f5d2026260a202020202020746869732e686f73746e616d652026262021746869732e706174686e616d6529207b0a20202020746869732e706174686e616d65203d20272f273b0a20207d0a0a20202f2f746f20737570706f727420687474702e726571756573740a202069662028746869732e706174686e616d65207c7c20746869732e73656172636829207b0a202020207661722070203d20746869732e706174686e616d65207c7c2027273b0a202020207661722073203d20746869732e736561726368207c7c2027273b0a20202020746869732e70617468203d2070202b20733b0a20207d0a0a20202f2f2066696e616c6c792c207265636f6e737472756374207468652068726566206261736564206f6e207768617420686173206265656e2076616c6964617465642e0a2020746869732e68726566203d20746869732e666f726d617428293b0a202072657475726e20746869733b0a7d3b0a0a2f2f20666f726d6174206120706172736564206f626a65637420696e746f20612075726c20737472696e670a66756e6374696f6e2075726c466f726d6174286f626a29207b0a20202f2f20656e73757265206974277320616e206f626a6563742c20616e64206e6f74206120737472696e672075726c2e0a20202f2f204966206974277320616e206f626a2c20746869732069732061206e6f2d6f702e0a20202f2f2074686973207761792c20796f752063616e2063616c6c2075726c5f666f726d61742829206f6e20737472696e67730a20202f2f20746f20636c65616e20757020706f74656e7469616c6c7920776f6e6b792075726c732e0a2020696620287574696c2e6973537472696e67286f626a2929206f626a203d2075726c5061727365286f626a293b0a20206966202821286f626a20696e7374616e63656f662055726c29292072657475726e2055726c2e70726f746f747970652e666f726d61742e63616c6c286f626a293b0a202072657475726e206f626a2e666f726d617428293b0a7d0a0a55726c2e70726f746f747970652e666f726d6174203d2066756e6374696f6e2829207b0a20207661722061757468203d20746869732e61757468207c7c2027273b0a2020696620286175746829207b0a2020202061757468203d20656e636f6465555249436f6d706f6e656e742861757468293b0a2020202061757468203d20617574682e7265706c616365282f2533412f692c20273a27293b0a2020202061757468202b3d202740273b0a20207d0a0a20207661722070726f746f636f6c203d20746869732e70726f746f636f6c207c7c2027272c0a202020202020706174686e616d65203d20746869732e706174686e616d65207c7c2027272c0a20202020202068617368203d20746869732e68617368207c7c2027272c0a202020202020686f7374203d2066616c73652c0a2020202020207175657279203d2027273b0a0a202069662028746869732e686f737429207b0a20202020686f7374203d2061757468202b20746869732e686f73743b0a20207d20656c73652069662028746869732e686f73746e616d6529207b0a20202020686f7374203d2061757468202b2028746869732e686f73746e616d652e696e6465784f6628273a2729203d3d3d202d31203f0a2020202020202020746869732e686f73746e616d65203a0a2020202020202020275b27202b20746869732e686f73746e616d65202b20275d27293b0a2020202069662028746869732e706f727429207b0a202020202020686f7374202b3d20273a27202b20746869732e706f72743b0a202020207d0a20207d0a0a202069662028746869732e71756572792026260a2020202020207574696c2e69734f626a65637428746869732e7175657279292026260a2020202020204f626a6563742e6b65797328746869732e7175657279292e6c656e67746829207b0a202020207175657279203d207175657279737472696e672e737472696e6769667928746869732e7175657279293b0a20207d0a0a202076617220736561726368203d20746869732e736561726368207c7c202871756572792026262028273f27202b2071756572792929207c7c2027273b0a0a20206966202870726f746f636f6c2026262070726f746f636f6c2e737562737472282d312920213d3d20273a27292070726f746f636f6c202b3d20273a273b0a0a20202f2f206f6e6c792074686520736c617368656450726f746f636f6c732067657420746865202f2f2e20204e6f74206d61696c746f3a2c20786d70703a2c206574632e0a20202f2f20756e6c657373207468657920686164207468656d20746f20626567696e20776974682e0a202069662028746869732e736c6173686573207c7c0a202020202020282170726f746f636f6c207c7c20736c617368656450726f746f636f6c5b70726f746f636f6c5d2920262620686f737420213d3d2066616c736529207b0a20202020686f7374203d20272f2f27202b2028686f7374207c7c202727293b0a2020202069662028706174686e616d6520262620706174686e616d652e63686172417428302920213d3d20272f272920706174686e616d65203d20272f27202b20706174686e616d653b0a20207d20656c7365206966202821686f737429207b0a20202020686f7374203d2027273b0a20207d0a0a2020696620286861736820262620686173682e63686172417428302920213d3d20272327292068617368203d20272327202b20686173683b0a202069662028736561726368202626207365617263682e63686172417428302920213d3d20273f272920736561726368203d20273f27202b207365617263683b0a0a2020706174686e616d65203d20706174686e616d652e7265706c616365282f5b3f235d2f672c2066756e6374696f6e286d6174636829207b0a2020202072657475726e20656e636f6465555249436f6d706f6e656e74286d61746368293b0a20207d293b0a2020736561726368203d207365617263682e7265706c616365282723272c202725323327293b0a0a202072657475726e2070726f746f636f6c202b20686f7374202b20706174686e616d65202b20736561726368202b20686173683b0a7d3b0a0a66756e6374696f6e2075726c5265736f6c766528736f757263652c2072656c617469766529207b0a202072657475726e2075726c506172736528736f757263652c2066616c73652c2074727565292e7265736f6c76652872656c6174697665293b0a7d0a0a55726c2e70726f746f747970652e7265736f6c7665203d2066756e6374696f6e2872656c617469766529207b0a202072657475726e20746869732e7265736f6c76654f626a6563742875726c50617273652872656c61746976652c2066616c73652c207472756529292e666f726d617428293b0a7d3b0a0a66756e6374696f6e2075726c5265736f6c76654f626a65637428736f757263652c2072656c617469766529207b0a20206966202821736f75726365292072657475726e2072656c61746976653b0a202072657475726e2075726c506172736528736f757263652c2066616c73652c2074727565292e7265736f6c76654f626a6563742872656c6174697665293b0a7d0a0a55726c2e70726f746f747970652e7265736f6c76654f626a656374203d2066756e6374696f6e2872656c617469766529207b0a202076617220746869732431203d20746869733b0a0a2020696620287574696c2e6973537472696e672872656c61746976652929207b0a202020207661722072656c203d206e65772055726c28293b0a2020202072656c2e70617273652872656c61746976652c2066616c73652c2074727565293b0a2020202072656c6174697665203d2072656c3b0a20207d0a0a202076617220726573756c74203d206e65772055726c28293b0a202076617220746b657973203d204f626a6563742e6b6579732874686973293b0a2020666f72202876617220746b203d20303b20746b203c20746b6579732e6c656e6774683b20746b2b2b29207b0a2020202076617220746b6579203d20746b6579735b746b5d3b0a20202020726573756c745b746b65795d203d207468697324315b746b65795d3b0a20207d0a0a20202f2f206861736820697320616c77617973206f76657272696464656e2c206e6f206d617474657220776861742e0a20202f2f206576656e20687265663d22222077696c6c2072656d6f76652069742e0a2020726573756c742e68617368203d2072656c61746976652e686173683b0a0a20202f2f206966207468652072656c61746976652075726c20697320656d7074792c207468656e2074686572652773206e6f7468696e67206c65667420746f20646f20686572652e0a20206966202872656c61746976652e68726566203d3d3d20272729207b0a20202020726573756c742e68726566203d20726573756c742e666f726d617428293b0a2020202072657475726e20726573756c743b0a20207d0a0a20202f2f206872656673206c696b65202f2f666f6f2f62617220616c776179732063757420746f207468652070726f746f636f6c2e0a20206966202872656c61746976652e736c6173686573202626202172656c61746976652e70726f746f636f6c29207b0a202020202f2f2074616b652065766572797468696e6720657863657074207468652070726f746f636f6c2066726f6d2072656c61746976650a2020202076617220726b657973203d204f626a6563742e6b6579732872656c6174697665293b0a20202020666f72202876617220726b203d20303b20726b203c20726b6579732e6c656e6774683b20726b2b2b29207b0a20202020202076617220726b6579203d20726b6579735b726b5d3b0a20202020202069662028726b657920213d3d202770726f746f636f6c27290a2020202020202020726573756c745b726b65795d203d2072656c61746976655b726b65795d3b0a202020207d0a0a202020202f2f75726c506172736520617070656e647320747261696c696e67202f20746f2075726c73206c696b6520687474703a2f2f7777772e6578616d706c652e636f6d0a2020202069662028736c617368656450726f746f636f6c5b726573756c742e70726f746f636f6c5d2026260a2020202020202020726573756c742e686f73746e616d652026262021726573756c742e706174686e616d6529207b0a202020202020726573756c742e70617468203d20726573756c742e706174686e616d65203d20272f273b0a202020207d0a0a20202020726573756c742e68726566203d20726573756c742e666f726d617428293b0a2020202072657475726e20726573756c743b0a20207d0a0a20206966202872656c61746976652e70726f746f636f6c2026262072656c61746976652e70726f746f636f6c20213d3d20726573756c742e70726f746f636f6c29207b0a202020202f2f20696620697427732061206b6e6f776e2075726c2070726f746f636f6c2c207468656e206368616e67696e670a202020202f2f207468652070726f746f636f6c20646f6573207765697264207468696e67730a202020202f2f2066697273742c2069662069742773206e6f742066696c653a2c207468656e207765204d5553542068617665206120686f73742c0a202020202f2f20616e6420696620746865726520776173206120706174680a202020202f2f20746f20626567696e20776974682c207468656e207765204d5553542068617665206120706174682e0a202020202f2f2069662069742069732066696c653a2c207468656e2074686520686f73742069732064726f707065642c0a202020202f2f206265636175736520746861742773206b6e6f776e20746f20626520686f73746c6573732e0a202020202f2f20616e797468696e6720656c736520697320617373756d656420746f206265206162736f6c7574652e0a202020206966202821736c617368656450726f746f636f6c5b72656c61746976652e70726f746f636f6c5d29207b0a202020202020766172206b657973203d204f626a6563742e6b6579732872656c6174697665293b0a202020202020666f7220287661722076203d20303b2076203c206b6579732e6c656e6774683b20762b2b29207b0a2020202020202020766172206b203d206b6579735b765d3b0a2020202020202020726573756c745b6b5d203d2072656c61746976655b6b5d3b0a2020202020207d0a202020202020726573756c742e68726566203d20726573756c742e666f726d617428293b0a20202020202072657475726e20726573756c743b0a202020207d0a0a20202020726573756c742e70726f746f636f6c203d2072656c61746976652e70726f746f636f6c3b0a20202020696620282172656c61746976652e686f73742026262021686f73746c65737350726f746f636f6c5b72656c61746976652e70726f746f636f6c5d29207b0a2020202020207661722072656c50617468203d202872656c61746976652e706174686e616d65207c7c202727292e73706c697428272f27293b0a2020202020207768696c65202872656c506174682e6c656e67746820262620212872656c61746976652e686f7374203d2072656c506174682e7368696674282929293b0a202020202020696620282172656c61746976652e686f7374292072656c61746976652e686f7374203d2027273b0a202020202020696620282172656c61746976652e686f73746e616d65292072656c61746976652e686f73746e616d65203d2027273b0a2020202020206966202872656c506174685b305d20213d3d202727292072656c506174682e756e7368696674282727293b0a2020202020206966202872656c506174682e6c656e677468203c2032292072656c506174682e756e7368696674282727293b0a202020202020726573756c742e706174686e616d65203d2072656c506174682e6a6f696e28272f27293b0a202020207d20656c7365207b0a202020202020726573756c742e706174686e616d65203d2072656c61746976652e706174686e616d653b0a202020207d0a20202020726573756c742e736561726368203d2072656c61746976652e7365617263683b0a20202020726573756c742e7175657279203d2072656c61746976652e71756572793b0a20202020726573756c742e686f7374203d2072656c61746976652e686f7374207c7c2027273b0a20202020726573756c742e61757468203d2072656c61746976652e617574683b0a20202020726573756c742e686f73746e616d65203d2072656c61746976652e686f73746e616d65207c7c2072656c61746976652e686f73743b0a20202020726573756c742e706f7274203d2072656c61746976652e706f72743b0a202020202f2f20746f20737570706f727420687474702e726571756573740a2020202069662028726573756c742e706174686e616d65207c7c20726573756c742e73656172636829207b0a2020202020207661722070203d20726573756c742e706174686e616d65207c7c2027273b0a2020202020207661722073203d20726573756c742e736561726368207c7c2027273b0a202020202020726573756c742e70617468203d2070202b20733b0a202020207d0a20202020726573756c742e736c6173686573203d20726573756c742e736c6173686573207c7c2072656c61746976652e736c61736865733b0a20202020726573756c742e68726566203d20726573756c742e666f726d617428293b0a2020202072657475726e20726573756c743b0a20207d0a0a2020766172206973536f75726365416273203d2028726573756c742e706174686e616d6520262620726573756c742e706174686e616d652e636861724174283029203d3d3d20272f27292c0a202020202020697352656c416273203d20280a2020202020202020202072656c61746976652e686f7374207c7c0a2020202020202020202072656c61746976652e706174686e616d652026262072656c61746976652e706174686e616d652e636861724174283029203d3d3d20272f270a202020202020292c0a2020202020206d757374456e64416273203d2028697352656c416273207c7c206973536f75726365416273207c7c0a202020202020202020202020202020202020202028726573756c742e686f73742026262072656c61746976652e706174686e616d6529292c0a20202020202072656d6f7665416c6c446f7473203d206d757374456e644162732c0a20202020202073726350617468203d20726573756c742e706174686e616d6520262620726573756c742e706174686e616d652e73706c697428272f2729207c7c205b5d2c0a20202020202072656c50617468203d2072656c61746976652e706174686e616d652026262072656c61746976652e706174686e616d652e73706c697428272f2729207c7c205b5d2c0a20202020202070737963686f746963203d20726573756c742e70726f746f636f6c2026262021736c617368656450726f746f636f6c5b726573756c742e70726f746f636f6c5d3b0a0a20202f2f206966207468652075726c2069732061206e6f6e2d736c61736865642075726c2c207468656e2072656c61746976650a20202f2f206c696e6b73206c696b65202e2e2f2e2e2073686f756c642062652061626c650a20202f2f20746f20637261776c20757020746f2074686520686f73746e616d652c2061732077656c6c2e20205468697320697320737472616e67652e0a20202f2f20726573756c742e70726f746f636f6c2068617320616c7265616479206265656e20736574206279206e6f772e0a20202f2f204c61746572206f6e2c20707574207468652066697273742070617468207061727420696e746f2074686520686f7374206669656c642e0a20206966202870737963686f74696329207b0a20202020726573756c742e686f73746e616d65203d2027273b0a20202020726573756c742e706f7274203d206e756c6c3b0a2020202069662028726573756c742e686f737429207b0a20202020202069662028737263506174685b305d203d3d3d2027272920737263506174685b305d203d20726573756c742e686f73743b0a202020202020656c736520737263506174682e756e736869667428726573756c742e686f7374293b0a202020207d0a20202020726573756c742e686f7374203d2027273b0a202020206966202872656c61746976652e70726f746f636f6c29207b0a20202020202072656c61746976652e686f73746e616d65203d206e756c6c3b0a20202020202072656c61746976652e706f7274203d206e756c6c3b0a2020202020206966202872656c61746976652e686f737429207b0a20202020202020206966202872656c506174685b305d203d3d3d202727292072656c506174685b305d203d2072656c61746976652e686f73743b0a2020202020202020656c73652072656c506174682e756e73686966742872656c61746976652e686f7374293b0a2020202020207d0a20202020202072656c61746976652e686f7374203d206e756c6c3b0a202020207d0a202020206d757374456e64416273203d206d757374456e64416273202626202872656c506174685b305d203d3d3d202727207c7c20737263506174685b305d203d3d3d202727293b0a20207d0a0a202069662028697352656c41627329207b0a202020202f2f2069742773206162736f6c7574652e0a20202020726573756c742e686f7374203d202872656c61746976652e686f7374207c7c2072656c61746976652e686f7374203d3d3d20272729203f0a20202020202020202020202020202020202072656c61746976652e686f7374203a20726573756c742e686f73743b0a20202020726573756c742e686f73746e616d65203d202872656c61746976652e686f73746e616d65207c7c2072656c61746976652e686f73746e616d65203d3d3d20272729203f0a2020202020202020202020202020202020202020202072656c61746976652e686f73746e616d65203a20726573756c742e686f73746e616d653b0a20202020726573756c742e736561726368203d2072656c61746976652e7365617263683b0a20202020726573756c742e7175657279203d2072656c61746976652e71756572793b0a2020202073726350617468203d2072656c506174683b0a202020202f2f2066616c6c207468726f75676820746f2074686520646f742d68616e646c696e672062656c6f772e0a20207d20656c7365206966202872656c506174682e6c656e67746829207b0a202020202f2f20697427732072656c61746976650a202020202f2f207468726f77206177617920746865206578697374696e672066696c652c20616e642074616b6520746865206e6577207061746820696e73746561642e0a20202020696620282173726350617468292073726350617468203d205b5d3b0a20202020737263506174682e706f7028293b0a2020202073726350617468203d20737263506174682e636f6e6361742872656c50617468293b0a20202020726573756c742e736561726368203d2072656c61746976652e7365617263683b0a20202020726573756c742e7175657279203d2072656c61746976652e71756572793b0a20207d20656c73652069662028217574696c2e69734e756c6c4f72556e646566696e65642872656c61746976652e7365617263682929207b0a202020202f2f206a7573742070756c6c206f757420746865207365617263682e0a202020202f2f206c696b6520687265663d273f666f6f272e0a202020202f2f20507574207468697320616674657220746865206f746865722074776f20636173657320626563617573652069742073696d706c69666965732074686520626f6f6c65616e730a202020206966202870737963686f74696329207b0a202020202020726573756c742e686f73746e616d65203d20726573756c742e686f7374203d20737263506174682e736869667428293b0a2020202020202f2f6f63636174696f6e616c792074686520617574682063616e2067657420737475636b206f6e6c7920696e20686f73740a2020202020202f2f7468697320657370656369616c6c792068617070656e7320696e206361736573206c696b650a2020202020202f2f75726c2e7265736f6c76654f626a65637428276d61696c746f3a6c6f63616c3140646f6d61696e31272c20276c6f63616c3240646f6d61696e3227290a2020202020207661722061757468496e486f7374203d20726573756c742e686f737420262620726573756c742e686f73742e696e6465784f662827402729203e2030203f0a2020202020202020202020202020202020202020202020726573756c742e686f73742e73706c69742827402729203a2066616c73653b0a2020202020206966202861757468496e486f737429207b0a2020202020202020726573756c742e61757468203d2061757468496e486f73742e736869667428293b0a2020202020202020726573756c742e686f7374203d20726573756c742e686f73746e616d65203d2061757468496e486f73742e736869667428293b0a2020202020207d0a202020207d0a20202020726573756c742e736561726368203d2072656c61746976652e7365617263683b0a20202020726573756c742e7175657279203d2072656c61746976652e71756572793b0a202020202f2f746f20737570706f727420687474702e726571756573740a2020202069662028217574696c2e69734e756c6c28726573756c742e706174686e616d6529207c7c20217574696c2e69734e756c6c28726573756c742e7365617263682929207b0a202020202020726573756c742e70617468203d2028726573756c742e706174686e616d65203f20726573756c742e706174686e616d65203a20272729202b0a202020202020202020202020202020202020202028726573756c742e736561726368203f20726573756c742e736561726368203a202727293b0a202020207d0a20202020726573756c742e68726566203d20726573756c742e666f726d617428293b0a2020202072657475726e20726573756c743b0a20207d0a0a20206966202821737263506174682e6c656e67746829207b0a202020202f2f206e6f207061746820617420616c6c2e2020656173792e0a202020202f2f20776527766520616c72656164792068616e646c656420746865206f746865722073747566662061626f76652e0a20202020726573756c742e706174686e616d65203d206e756c6c3b0a202020202f2f746f20737570706f727420687474702e726571756573740a2020202069662028726573756c742e73656172636829207b0a202020202020726573756c742e70617468203d20272f27202b20726573756c742e7365617263683b0a202020207d20656c7365207b0a202020202020726573756c742e70617468203d206e756c6c3b0a202020207d0a20202020726573756c742e68726566203d20726573756c742e666f726d617428293b0a2020202072657475726e20726573756c743b0a20207d0a0a20202f2f20696620612075726c20454e447320696e202e206f72202e2e2c207468656e206974206d75737420676574206120747261696c696e6720736c6173682e0a20202f2f20686f77657665722c20696620697420656e647320696e20616e797468696e6720656c7365206e6f6e2d736c617368792c0a20202f2f207468656e206974206d757374204e4f5420676574206120747261696c696e6720736c6173682e0a2020766172206c617374203d20737263506174682e736c696365282d31295b305d3b0a202076617220686173547261696c696e67536c617368203d20280a20202020202028726573756c742e686f7374207c7c2072656c61746976652e686f7374207c7c20737263506174682e6c656e677468203e2031292026260a202020202020286c617374203d3d3d20272e27207c7c206c617374203d3d3d20272e2e2729207c7c206c617374203d3d3d202727293b0a0a20202f2f2073747269702073696e676c6520646f74732c207265736f6c766520646f75626c6520646f747320746f20706172656e74206469720a20202f2f20696620746865207061746820747269657320746f20676f2061626f76652074686520726f6f742c206075706020656e6473207570203e20300a2020766172207570203d20303b0a2020666f7220287661722069203d20737263506174682e6c656e6774683b2069203e3d20303b20692d2d29207b0a202020206c617374203d20737263506174685b695d3b0a20202020696620286c617374203d3d3d20272e2729207b0a202020202020737263506174682e73706c69636528692c2031293b0a202020207d20656c736520696620286c617374203d3d3d20272e2e2729207b0a202020202020737263506174682e73706c69636528692c2031293b0a20202020202075702b2b3b0a202020207d20656c73652069662028757029207b0a202020202020737263506174682e73706c69636528692c2031293b0a20202020202075702d2d3b0a202020207d0a20207d0a0a20202f2f20696620746865207061746820697320616c6c6f77656420746f20676f2061626f76652074686520726f6f742c20726573746f7265206c656164696e67202e2e730a202069662028216d757374456e64416273202626202172656d6f7665416c6c446f747329207b0a20202020666f7220283b2075702d2d3b20757029207b0a202020202020737263506174682e756e736869667428272e2e27293b0a202020207d0a20207d0a0a2020696620286d757374456e6441627320262620737263506174685b305d20213d3d2027272026260a2020202020202821737263506174685b305d207c7c20737263506174685b305d2e63686172417428302920213d3d20272f272929207b0a20202020737263506174682e756e7368696674282727293b0a20207d0a0a202069662028686173547261696c696e67536c6173682026262028737263506174682e6a6f696e28272f27292e737562737472282d312920213d3d20272f272929207b0a20202020737263506174682e70757368282727293b0a20207d0a0a20207661722069734162736f6c757465203d20737263506174685b305d203d3d3d202727207c7c0a20202020202028737263506174685b305d20262620737263506174685b305d2e636861724174283029203d3d3d20272f27293b0a0a20202f2f207075742074686520686f7374206261636b0a20206966202870737963686f74696329207b0a20202020726573756c742e686f73746e616d65203d20726573756c742e686f7374203d2069734162736f6c757465203f202727203a0a202020202020202020202020202020202020202020202020202020202020202020202020737263506174682e6c656e677468203f20737263506174682e73686966742829203a2027273b0a202020202f2f6f63636174696f6e616c792074686520617574682063616e2067657420737475636b206f6e6c7920696e20686f73740a202020202f2f7468697320657370656369616c6c792068617070656e7320696e206361736573206c696b650a202020202f2f75726c2e7265736f6c76654f626a65637428276d61696c746f3a6c6f63616c3140646f6d61696e31272c20276c6f63616c3240646f6d61696e3227290a202020207661722061757468496e486f7374203d20726573756c742e686f737420262620726573756c742e686f73742e696e6465784f662827402729203e2030203f0a202020202020202020202020202020202020202020726573756c742e686f73742e73706c69742827402729203a2066616c73653b0a202020206966202861757468496e486f737429207b0a202020202020726573756c742e61757468203d2061757468496e486f73742e736869667428293b0a202020202020726573756c742e686f7374203d20726573756c742e686f73746e616d65203d2061757468496e486f73742e736869667428293b0a202020207d0a20207d0a0a20206d757374456e64416273203d206d757374456e64416273207c7c2028726573756c742e686f737420262620737263506174682e6c656e677468293b0a0a2020696620286d757374456e64416273202626202169734162736f6c75746529207b0a20202020737263506174682e756e7368696674282727293b0a20207d0a0a20206966202821737263506174682e6c656e67746829207b0a20202020726573756c742e706174686e616d65203d206e756c6c3b0a20202020726573756c742e70617468203d206e756c6c3b0a20207d20656c7365207b0a20202020726573756c742e706174686e616d65203d20737263506174682e6a6f696e28272f27293b0a20207d0a0a20202f2f746f20737570706f727420726571756573742e687474700a202069662028217574696c2e69734e756c6c28726573756c742e706174686e616d6529207c7c20217574696c2e69734e756c6c28726573756c742e7365617263682929207b0a20202020726573756c742e70617468203d2028726573756c742e706174686e616d65203f20726573756c742e706174686e616d65203a20272729202b0a20202020202020202020202020202020202028726573756c742e736561726368203f20726573756c742e736561726368203a202727293b0a20207d0a2020726573756c742e61757468203d2072656c61746976652e61757468207c7c20726573756c742e617574683b0a2020726573756c742e736c6173686573203d20726573756c742e736c6173686573207c7c2072656c61746976652e736c61736865733b0a2020726573756c742e68726566203d20726573756c742e666f726d617428293b0a202072657475726e20726573756c743b0a7d3b0a0a55726c2e70726f746f747970652e7061727365486f7374203d2066756e6374696f6e2829207b0a202076617220686f7374203d20746869732e686f73743b0a202076617220706f7274203d20706f72745061747465726e2e6578656328686f7374293b0a202069662028706f727429207b0a20202020706f7274203d20706f72745b305d3b0a2020202069662028706f727420213d3d20273a2729207b0a202020202020746869732e706f7274203d20706f72742e7375627374722831293b0a202020207d0a20202020686f7374203d20686f73742e73756273747228302c20686f73742e6c656e677468202d20706f72742e6c656e677468293b0a20207d0a202069662028686f73742920746869732e686f73746e616d65203d20686f73743b0a7d3b0a7d293b0a0a7661722075726c2431203d20696e7465726f7044656661756c742875726c293b0a0a766172204e6f4d617463684572726f72203d202866756e6374696f6e20284572726f7229207b0a2020202066756e6374696f6e204e6f4d617463684572726f722829207b0a20202020202020204572726f722e63616c6c2874686973293b0a2020202020202020746869732e636f6465203d20274e4f5f4d41544348273b0a202020207d0a0a2020202069662028204572726f722029204e6f4d617463684572726f722e5f5f70726f746f5f5f203d204572726f723b0a202020204e6f4d617463684572726f722e70726f746f74797065203d204f626a6563742e63726561746528204572726f72202626204572726f722e70726f746f7479706520293b0a202020204e6f4d617463684572726f722e70726f746f747970652e636f6e7374727563746f72203d204e6f4d617463684572726f723b0a0a2020202072657475726e204e6f4d617463684572726f723b0a7d284572726f7229293b0a0a7661722052656469726563744572726f72203d202866756e6374696f6e20284572726f7229207b0a2020202066756e6374696f6e2052656469726563744572726f7228737461747573436f64652c2075726c29207b0a2020202020202020746869732e737461747573436f6465203d20737461747573436f64653b0a2020202020202020746869732e7265646972656374546f55726c203d2075726c3b0a2020202020202020746869732e636f6465203d20275245444952454354273b0a202020207d0a0a2020202069662028204572726f7220292052656469726563744572726f722e5f5f70726f746f5f5f203d204572726f723b0a2020202052656469726563744572726f722e70726f746f74797065203d204f626a6563742e63726561746528204572726f72202626204572726f722e70726f746f7479706520293b0a2020202052656469726563744572726f722e70726f746f747970652e636f6e7374727563746f72203d2052656469726563744572726f723b0a0a2020202072657475726e2052656469726563744572726f723b0a7d284572726f7229293b0a0a76617220526f75746572203d2066756e6374696f6e20526f7574657228726f75746573546f41646429207b0a2020202076617220746869732431203d20746869733b0a0a20202020746869732e726f75746573203d205b5d3b0a0a20202020666f7220287661722075726c5061747465726e20696e20726f75746573546f41646429207b0a202020202020202076617220726f757465203d20526f7574652875726c5061747465726e293b0a20202020202020207468697324312e726f757465732e70757368287b0a202020202020202020202020726f7574653a20726f7574652c0a20202020202020202020202066756e633a20726f75746573546f4164645b75726c5061747465726e5d0a20202020202020207d290a202020207d200a7d3b0a0a526f757465722e70726f746f747970652e6469737061746368203d2066756e6374696f6e206469737061746368202875726c546f446973706174636829207b0a202020202020202076617220746869732431203d20746869733b0a0a2020202072657475726e2050726f6d6973652e7265736f6c766528290a202020202e7468656e2866756e6374696f6e202829207b0a20202020202020207661722061726773203d207b0a20202020202020202020202075726c3a2075726c546f44697370617463680a20202020202020207d3b0a0a2020202020202020666f7220287661722078203d20303b2078203c207468697324312e726f757465732e6c656e6774683b20782b2b29207b0a20202020202020202020202076617220726566203d207468697324312e726f757465735b785d3b0a2020202020202020202020202020202076617220726f757465203d207265662e726f7574653b0a202020202020202020202020202020207661722066756e63203d207265662e66756e633b0a202020202020202020202020766172206d61746368203d20726f7574652e6d617463682875726c546f4469737061746368290a202020202020202020202020202020200a202020202020202020202020696620286d6174636829207b0a20202020202020202020202020202020636f6e736f6c652e6c6f672827474f54204d4154434827290a20202020202020202020202020202020617267732e706172616d73203d206d617463683b0a2020202020202020202020202020202072657475726e2050726f6d6973652e7265736f6c76652866756e63286172677329290a2020202020202020202020207d0a20202020202020207d0a0a202020202020202076617220706172736564203d2075726c24312e70617273652875726c546f4469737061746368293b0a2020202020202020766172207061746853706c6974203d207061727365642e706174686e616d652e73706c697428272f27293b0a2020202020202020202020200a2020202020202020696620287061746853706c69745b7061746853706c69742e6c656e677468202d20315d2e696e6465784f6628222e2229203d3d202d3129207b0a2020202020202020202020202f2f206d61796265206974277320612055524c2074686174206e656564732061202f20617070656e64656420746f2074686520656e640a0a2020202020202020202020207661722077697468536c617368203d2075726c546f4469737061746368202b20222f223b0a0a202020202020202020202020766172206861734d61746368203d207468697324312e726f757465732e736f6d652866756e6374696f6e202872656629207b0a202020202020202020202020202020202020202076617220726f757465203d207265662e726f7574653b0a0a2020202020202020202020202020202072657475726e20726f7574652e6d617463682877697468536c617368290a2020202020202020202020207d290a0a202020202020202020202020696620286861734d6174636829207b0a202020202020202020202020202020207468726f77206e65772052656469726563744572726f72283330312c2077697468536c617368293b0a2020202020202020202020207d0a0a20202020202020207d0a0a202020202020202076617220657272203d206e6577204e6f4d617463684572726f722822436f756c64206e6f742066696e642055524c206d6174636820666f723a22202b2075726c546f4469737061746368293b0a20202020202020207468726f77206572723b0a202020207d290a0a20202020202020200a7d3b0a0a2f2a2a205669727475616c20444f4d204e6f6465202a2f0a66756e6374696f6e20564e6f6465286e6f64654e616d652c20617474726962757465732c206368696c6472656e29207b0a092f2a2a204074797065207b737472696e677c66756e6374696f6e7d202a2f0a09746869732e6e6f64654e616d65203d206e6f64654e616d653b0a0a092f2a2a204074797065207b6f626a6563743c737472696e673e7c756e646566696e65647d202a2f0a09746869732e61747472696275746573203d20617474726962757465733b0a0a092f2a2a204074797065207b61727261793c564e6f64653e7c756e646566696e65647d202a2f0a09746869732e6368696c6472656e203d206368696c6472656e3b0a0a092f2a2a205265666572656e636520746f2074686520676976656e206b65792e202a2f0a09746869732e6b6579203d206174747269627574657320262620617474726962757465732e6b65793b0a7d0a0a2f2a2a20436f7079206f776e2d70726f706572746965732066726f6d206070726f707360206f6e746f20606f626a602e0a202a094072657475726e73206f626a0a202a0940707269766174650a202a2f0a66756e6374696f6e20657874656e64286f626a2c2070726f707329207b0a096966202870726f707329207b0a0909666f722028766172206920696e2070726f707329207b0a0909096966202870726f70735b695d213d3d756e646566696e656429207b0a090909096f626a5b695d203d2070726f70735b695d3b0a0909097d0a09097d0a097d0a0972657475726e206f626a3b0a7d0a0a0a2f2a2a204661737420636c6f6e652e204e6f74653a20646f6573206e6f742066696c746572206f7574206e6f6e2d6f776e2070726f706572746965732e0a202a09407365652068747470733a2f2f657362656e63682e636f6d2f62656e63682f3536626161333466343564663638393530303265303362360a202a2f0a66756e6374696f6e20636c6f6e65286f626a29207b0a0972657475726e20657874656e64287b7d2c206f626a293b0a7d0a0a0a2f2a2a20476574206120646565702070726f70657274792076616c75652066726f6d2074686520676976656e206f626a6563742c2065787072657373656420696e20646f742d6e6f746174696f6e2e0a202a0940707269766174650a202a2f0a66756e6374696f6e2064656c7665286f626a2c206b657929207b0a09666f72202876617220703d6b65792e73706c697428272e27292c20693d303b20693c702e6c656e677468202626206f626a3b20692b2b29207b0a09096f626a203d206f626a5b705b695d5d3b0a097d0a0972657475726e206f626a3b0a7d0a0a0a2f2a2a2040707269766174652069732074686520676976656e206f626a65637420612046756e6374696f6e3f202a2f0a66756e6374696f6e20697346756e6374696f6e286f626a29207b0a0972657475726e202766756e6374696f6e273d3d3d747970656f66206f626a3b0a7d0a0a0a2f2a2a2040707269766174652069732074686520676976656e206f626a656374206120537472696e673f202a2f0a66756e6374696f6e206973537472696e672431286f626a29207b0a0972657475726e2027737472696e67273d3d3d747970656f66206f626a3b0a7d0a0a0a2f2a2a20436865636b20696620612076616c756520697320606e756c6c60206f722060756e646566696e6564602e0a202a0940707269766174650a202a2f0a66756e6374696f6e20656d707479287829207b0a0972657475726e20783d3d3d756e646566696e6564207c7c20783d3d3d6e756c6c3b0a7d0a0a0a2f2a2a20436865636b20696620612076616c756520697320606e756c6c602c2060756e646566696e6564602c206f72206578706c696369746c79206066616c7365602e202a2f0a66756e6374696f6e2066616c7365792876616c756529207b0a0972657475726e2076616c75653d3d3d66616c7365207c7c20656d7074792876616c7565293b0a7d0a0a0a2f2a2a20436f6e76657274206120686173686d6170206f662043535320636c617373657320746f20612073706163652d64656c696d6974656420636c6173734e616d6520737472696e670a202a0940707269766174650a202a2f0a66756e6374696f6e2068617368546f436c6173734e616d65286329207b0a0976617220737472203d2027273b0a09666f7220287661722070726f7020696e206329207b0a090969662028635b70726f705d29207b0a090909696620287374722920737472202b3d202720273b0a090909737472202b3d2070726f703b0a09097d0a097d0a0972657475726e207374723b0a7d0a0a0a2f2a2a204a7573742061206d656d6f697a656420537472696e6723746f4c6f77657243617365202a2f0a766172206c634361636865203d207b7d3b0a76617220746f4c6f77657243617365203d2066756e6374696f6e20287329207b2072657475726e206c6343616368655b735d207c7c20286c6343616368655b735d203d20732e746f4c6f776572436173652829293b207d3b0a0a0a2f2a2a2043616c6c20612066756e6374696f6e206173796e6368726f6e6f75736c792c20617320736f6f6e20617320706f737369626c652e0a202a0940706172616d207b46756e6374696f6e7d2063616c6c6261636b0a202a2f0a766172207265736f6c766564203d20747970656f662050726f6d697365213d3d27756e646566696e6564272026262050726f6d6973652e7265736f6c766528293b0a766172206465666572203d207265736f6c766564203f202866756e6374696f6e20286629207b207265736f6c7665642e7468656e2866293b207d29203a2073657454696d656f75743b0a0a2f2a2a20476c6f62616c206f7074696f6e730a202a09407075626c69630a202a09406e616d657370616365206f7074696f6e73207b4f626a6563747d0a202a2f0a766172206f7074696f6e73203d207b0a0a092f2a2a204966206074727565602c206070726f7060206368616e67657320747269676765722073796e6368726f6e6f757320636f6d706f6e656e7420757064617465732e0a09202a09406e616d652073796e63436f6d706f6e656e74557064617465730a09202a09407479706520426f6f6c65616e0a09202a094064656661756c7420747275650a09202a2f0a092f2f73796e63436f6d706f6e656e74557064617465733a20747275652c0a0a092f2a2a2050726f63657373657320616c6c206372656174656420564e6f6465732e0a09202a0940706172616d207b564e6f64657d20766e6f64650941206e65776c792d6372656174656420564e6f646520746f206e6f726d616c697a652f70726f636573730a09202a2f0a09766e6f64653a20656d7074790a7d3b0a0a766172205348415245445f54454d505f4152524159203d205b5d3b0a0a0a2f2a2a204a53582f687970657273637269707420726576697665720a202a094073656520687474703a2f2f6a61736f6e666f726d61742e636f6d2f7774662d69732d6a73780a202a09407075626c69630a202a2020406578616d706c650a202a20202f2a2a20406a73782068202a5c2f0a202a2020696d706f7274207b2072656e6465722c2068207d2066726f6d2027707265616374273b0a202a202072656e646572283c7370616e3e666f6f3c2f7370616e3e2c20646f63756d656e742e626f6479293b0a202a2f0a66756e6374696f6e2068286e6f64654e616d652c20617474726962757465732c2066697273744368696c6429207b0a0976617220617267756d656e74732431203d20617267756d656e74733b0a0a09766172206c656e203d20617267756d656e74732e6c656e6774682c0a09096368696c6472656e2c206172722c206c61737453696d706c653b0a0a0a09696620286c656e3e3229207b0a09097661722074797065203d20747970656f662066697273744368696c643b0a0909696620286c656e3d3d3d332026262074797065213d3d276f626a656374272026262074797065213d3d2766756e6374696f6e2729207b0a090909696620282166616c7365792866697273744368696c642929207b0a090909096368696c6472656e203d205b537472696e672866697273744368696c64295d3b0a0909097d0a09097d0a0909656c7365207b0a0909096368696c6472656e203d205b5d3b0a090909666f72202876617220693d323b20693c6c656e3b20692b2b29207b0a0909090976617220702431203d20617267756d656e747324315b695d3b0a090909096966202866616c73657928702431292920636f6e74696e75653b0a09090909696620287024312e6a6f696e2920617272203d207024313b0a09090909656c73652028617272203d205348415245445f54454d505f4152524159295b305d203d207024313b0a09090909666f722028766172206a3d303b206a3c6172722e6c656e6774683b206a2b2b29207b0a0909090909766172206368696c64203d206172725b6a5d2c0a09090909090973696d706c65203d20212866616c736579286368696c6429207c7c20697346756e6374696f6e286368696c6429207c7c206368696c6420696e7374616e63656f6620564e6f6465293b0a09090909096966202873696d706c6520262620216973537472696e672431286368696c642929206368696c64203d20537472696e67286368696c64293b0a09090909096966202873696d706c65202626206c61737453696d706c6529207b0a0909090909096368696c6472656e5b6368696c6472656e2e6c656e6774682d315d202b3d206368696c643b0a09090909097d0a0909090909656c736520696620282166616c736579286368696c642929207b0a0909090909096368696c6472656e2e70757368286368696c64293b0a0909090909096c61737453696d706c65203d2073696d706c653b0a09090909097d0a090909097d0a0909097d0a09097d0a097d0a09656c736520696620286174747269627574657320262620617474726962757465732e6368696c6472656e29207b0a090972657475726e2068286e6f64654e616d652c20617474726962757465732c20617474726962757465732e6368696c6472656e293b0a097d0a0a09696620286174747269627574657329207b0a090969662028617474726962757465732e6368696c6472656e29207b0a09090964656c65746520617474726962757465732e6368696c6472656e3b0a09097d0a0a09096966202821697346756e6374696f6e286e6f64654e616d652929207b0a0909092f2f206e6f726d616c697a6520636c6173734e616d6520746f20636c6173732e0a0909096966202827636c6173734e616d652720696e206174747269627574657329207b0a09090909617474726962757465732e636c617373203d20617474726962757465732e636c6173734e616d653b0a0909090964656c65746520617474726962757465732e636c6173734e616d653b0a0909097d0a0a0909096c61737453696d706c65203d20617474726962757465732e636c6173733b0a090909696620286c61737453696d706c6520262620216973537472696e672431286c61737453696d706c652929207b0a09090909617474726962757465732e636c617373203d2068617368546f436c6173734e616d65286c61737453696d706c65293b0a0909097d0a0a0909092f2f206c61737453696d706c65203d20617474726962757465732e7374796c653b0a0909092f2f20696620286c61737453696d706c6520262620216973537472696e67286c61737453696d706c652929207b0a0909092f2f2009617474726962757465732e7374796c65203d207374796c654f626a546f437373286c61737453696d706c65293b0a0909092f2f207d0a09097d0a097d0a0a097661722070203d206e657720564e6f6465286e6f64654e616d652c2061747472696275746573207c7c20756e646566696e65642c206368696c6472656e293b0a09696620286f7074696f6e732e766e6f646529206f7074696f6e732e766e6f64652870293b0a0972657475726e20703b0a7d0a0a2f2f2072656e646572206d6f6465730a0a766172204e4f5f52454e444552203d20303b0a7661722053594e435f52454e444552203d20313b0a76617220464f5243455f52454e444552203d20323b0a766172204153594e435f52454e444552203d20333b0a0a76617220454d505459203d207b7d3b0a0a76617220415454525f4b4559203d20747970656f662053796d626f6c213d3d27756e646566696e656427203f2053796d626f6c2e666f722827707265616374617474722729203a20275f5f707265616374617474725f273b0a0a2f2f20444f4d2070726f7065727469657320746861742073686f756c64204e4f5420686176652022707822206164646564207768656e206e756d657269630a766172204e4f4e5f44494d454e53494f4e5f50524f5053203d207b0a09626f78466c65783a312c20626f78466c657847726f75703a312c20636f6c756d6e436f756e743a312c2066696c6c4f7061636974793a312c20666c65783a312c20666c657847726f773a312c0a09666c6578506f7369746976653a312c20666c6578536872696e6b3a312c20666c65784e656761746976653a312c20666f6e745765696768743a312c206c696e65436c616d703a312c206c696e654865696768743a312c0a096f7061636974793a312c206f726465723a312c206f727068616e733a312c207374726f6b654f7061636974793a312c207769646f77733a312c207a496e6465783a312c207a6f6f6d3a310a7d3b0a0a2f2a2a2043726561746520616e204576656e742068616e646c65722066756e6374696f6e20746861742073657473206120676976656e2073746174652070726f70657274792e0a202a0940706172616d207b436f6d706f6e656e747d20636f6d706f6e656e740954686520636f6d706f6e656e742077686f73652073746174652073686f756c6420626520757064617465640a202a0940706172616d207b737472696e677d206b6579090909094120646f742d6e6f7461746564206b6579207061746820746f2075706461746520696e2074686520636f6d706f6e656e7427732073746174650a202a0940706172616d207b737472696e677d206576656e745061746809094120646f742d6e6f7461746564206b6579207061746820746f207468652076616c756520746861742073686f756c64206265207265747269657665642066726f6d20746865204576656e74206f7220636f6d706f6e656e740a202a094072657475726e73207b66756e6374696f6e7d206c696e6b6564537461746548616e646c65720a202a0940707269766174650a202a2f0a66756e6374696f6e206372656174654c696e6b6564537461746528636f6d706f6e656e742c206b65792c206576656e745061746829207b0a097661722070617468203d206b65792e73706c697428272e27292c0a09097030203d20706174685b305d3b0a0972657475726e2066756e6374696f6e286529207b0a09097661722074203d206520262620652e63757272656e74546172676574207c7c20746869732c0a09090973203d20636f6d706f6e656e742e73746174652c0a0909096f626a203d20732c0a090909762c20693b0a0909696620286973537472696e672431286576656e74506174682929207b0a09090976203d2064656c766528652c206576656e7450617468293b0a09090969662028656d7074792876292026262028743d742e5f636f6d706f6e656e742929207b0a0909090976203d2064656c766528742c206576656e7450617468293b0a0909097d0a09097d0a0909656c7365207b0a09090976203d20742e6e6f64654e616d65203f202828742e6e6f64654e616d652b742e74797065292e6d61746368282f5e696e70757428636865636b7c726164292f6929203f20742e636865636b6564203a20742e76616c756529203a20653b0a09097d0a090969662028697346756e6374696f6e287629292076203d20762e63616c6c2874293b0a090969662028706174682e6c656e6774683e3129207b0a090909666f722028693d303b20693c706174682e6c656e6774682d313b20692b2b29207b0a090909096f626a203d206f626a5b706174685b695d5d207c7c20286f626a5b706174685b695d5d203d207b7d293b0a0909097d0a0909096f626a5b706174685b695d5d203d20763b0a09090976203d20735b70305d3b0a09097d0a0909766172206f626a24313b0a0909636f6d706f6e656e742e73657453746174652828206f626a2431203d207b7d2c206f626a24315b70305d203d20762c206f626a24312029293b0a097d3b0a7d0a0a766172206974656d73203d205b5d3b0a766172206974656d734f66666c696e65203d205b5d3b0a66756e6374696f6e20656e717565756552656e64657228636f6d706f6e656e7429207b0a09696620286974656d732e7075736828636f6d706f6e656e7429213d3d31292072657475726e3b0a0a09286f7074696f6e732e6465626f756e636552656e646572696e67207c7c2064656665722928726572656e646572293b0a7d0a0a0a66756e6374696f6e20726572656e6465722829207b0a0969662028216974656d732e6c656e677468292072657475726e3b0a0a097661722063757272656e744974656d73203d206974656d732c0a0909703b0a0a092f2f2073776170206f6e6c696e652026206f66666c696e650a096974656d73203d206974656d734f66666c696e653b0a096974656d734f66666c696e65203d2063757272656e744974656d733b0a0a097768696c652028202870203d2063757272656e744974656d732e706f702829292029207b0a090969662028702e5f6469727479292072656e646572436f6d706f6e656e742870293b0a097d0a7d0a0a2f2a2a20436865636b206966206120564e6f64652069732061207265666572656e636520746f20612073746174656c6573732066756e6374696f6e616c20636f6d706f6e656e742e0a202a09412066756e6374696f6e20636f6d706f6e656e7420697320726570726573656e746564206173206120564e6f64652077686f736520606e6f64654e616d65602070726f70657274792069732061207265666572656e636520746f20612066756e6374696f6e2e0a202a09496620746861742066756e6374696f6e206973206e6f74206120436f6d706f6e656e74202869652c20686173206e6f20602e72656e646572282960206d6574686f64206f6e20612070726f746f74797065292c20697420697320636f6e7369646572656420612073746174656c6573732066756e6374696f6e616c20636f6d706f6e656e742e0a202a0940706172616d207b564e6f64657d20766e6f6465094120564e6f64650a202a0940707269766174650a202a2f0a66756e6374696f6e20697346756e6374696f6e616c436f6d706f6e656e7428766e6f646529207b0a09766172206e6f64654e616d65203d20766e6f646520262620766e6f64652e6e6f64654e616d653b0a0972657475726e206e6f64654e616d6520262620697346756e6374696f6e286e6f64654e616d65292026262021286e6f64654e616d652e70726f746f74797065202626206e6f64654e616d652e70726f746f747970652e72656e646572293b0a7d0a0a0a0a2f2a2a20436f6e737472756374206120726573756c74616e7420564e6f64652066726f6d206120564e6f6465207265666572656e63696e6720612073746174656c6573732066756e6374696f6e616c20636f6d706f6e656e742e0a202a0940706172616d207b564e6f64657d20766e6f6465094120564e6f64652077697468206120606e6f64654e616d65602070726f706572747920746861742069732061207265666572656e636520746f20612066756e6374696f6e2e0a202a0940707269766174650a202a2f0a66756e6374696f6e206275696c6446756e6374696f6e616c436f6d706f6e656e7428766e6f64652c20636f6e7465787429207b0a0972657475726e20766e6f64652e6e6f64654e616d65286765744e6f646550726f707328766e6f6465292c20636f6e74657874207c7c20454d505459293b0a7d0a0a66756e6374696f6e20656e737572654e6f646544617461286e6f64652c206461746129207b0a0972657475726e206e6f64655b415454525f4b45595d207c7c20286e6f64655b415454525f4b45595d203d202864617461207c7c207b7d29293b0a7d0a0a0a66756e6374696f6e206765744e6f646554797065286e6f646529207b0a09696620286e6f646520696e7374616e63656f662054657874292072657475726e20333b0a09696620286e6f646520696e7374616e63656f6620456c656d656e74292072657475726e20313b0a0972657475726e20303b0a7d0a0a0a2f2a2a2052656d6f766573206120676976656e20444f4d204e6f64652066726f6d2069747320706172656e742e202a2f0a66756e6374696f6e2072656d6f76654e6f6465286e6f646529207b0a097661722070203d206e6f64652e706172656e744e6f64653b0a0969662028702920702e72656d6f76654368696c64286e6f6465293b0a7d0a0a0a2f2a2a205365742061206e616d656420617474726962757465206f6e2074686520676976656e204e6f64652c2077697468207370656369616c206265686176696f7220666f7220736f6d65206e616d657320616e64206576656e742068616e646c6572732e0a202a094966206076616c75656020697320606e756c6c602c20746865206174747269627574652f68616e646c65722077696c6c2062652072656d6f7665642e0a202a0940706172616d207b456c656d656e747d206e6f646509416e20656c656d656e7420746f206d75746174650a202a0940706172616d207b737472696e677d206e616d6509546865206e616d652f6b657920746f207365742c207375636820617320616e206576656e74206f7220617474726962757465206e616d650a202a0940706172616d207b616e797d2076616c75650909416e206174747269627574652076616c75652c207375636820617320612066756e6374696f6e20746f206265207573656420617320616e206576656e742068616e646c65720a202a0940706172616d207b616e797d2070726576696f757356616c756509546865206c6173742076616c75652074686174207761732073657420666f722074686973206e616d652f6e6f646520706169720a202a0940707269766174650a202a2f0a66756e6374696f6e207365744163636573736f72286e6f64652c206e616d652c2076616c75652c206f6c642c20697353766729207b0a09656e737572654e6f646544617461286e6f6465295b6e616d655d203d2076616c75653b0a0a09696620286e616d653d3d3d276b657927207c7c206e616d653d3d3d276368696c6472656e27207c7c206e616d653d3d3d27696e6e657248544d4c27292072657475726e3b0a0a09696620286e616d653d3d3d27636c617373272026262021697353766729207b0a09096e6f64652e636c6173734e616d65203d2076616c7565207c7c2027273b0a097d0a09656c736520696620286e616d653d3d3d277374796c652729207b0a0909696620282176616c7565207c7c206973537472696e6724312876616c756529207c7c206973537472696e672431286f6c642929207b0a0909096e6f64652e7374796c652e63737354657874203d2076616c7565207c7c2027273b0a09097d0a09096966202876616c756520262620747970656f662076616c75653d3d3d276f626a6563742729207b0a09090969662028216973537472696e672431286f6c642929207b0a09090909666f722028766172206920696e206f6c6429206966202821286920696e2076616c75652929206e6f64652e7374796c655b695d203d2027273b0a0909097d0a090909666f7220287661722069243120696e2076616c756529207b0a090909096e6f64652e7374796c655b6924315d203d20747970656f662076616c75655b6924315d3d3d3d276e756d6265722720262620214e4f4e5f44494d454e53494f4e5f50524f50535b6924315d203f202876616c75655b6924315d2b2770782729203a2076616c75655b6924315d3b0a0909097d0a09097d0a097d0a09656c736520696620286e616d653d3d3d2764616e6765726f75736c79536574496e6e657248544d4c2729207b0a09096966202876616c756529206e6f64652e696e6e657248544d4c203d2076616c75652e5f5f68746d6c3b0a097d0a09656c736520696620286e616d652e6d61746368282f5e6f6e2f692929207b0a0909766172206c203d206e6f64652e5f6c697374656e657273207c7c20286e6f64652e5f6c697374656e657273203d207b7d293b0a09096e616d65203d20746f4c6f77657243617365286e616d652e737562737472696e67283229293b0a09096966202876616c756529207b0a09090969662028216c5b6e616d655d29206e6f64652e6164644576656e744c697374656e6572286e616d652c206576656e7450726f7879293b0a09097d0a0909656c736520696620286c5b6e616d655d29207b0a0909096e6f64652e72656d6f76654576656e744c697374656e6572286e616d652c206576656e7450726f7879293b0a09097d0a09096c5b6e616d655d203d2076616c75653b0a097d0a09656c736520696620286e616d65213d3d27747970652720262620216973537667202626206e616d6520696e206e6f646529207b0a090973657450726f7065727479286e6f64652c206e616d652c20656d7074792876616c756529203f202727203a2076616c7565293b0a09096966202866616c7365792876616c75652929206e6f64652e72656d6f7665417474726962757465286e616d65293b0a097d0a09656c7365207b0a0909766172206e73203d206973537667202626206e616d652e6d61746368282f5e786c696e6b5c3a3f282e2b292f293b0a09096966202866616c7365792876616c75652929207b0a090909696620286e7329206e6f64652e72656d6f76654174747269627574654e532827687474703a2f2f7777772e77332e6f72672f313939392f786c696e6b272c20746f4c6f77657243617365286e735b315d29293b0a090909656c7365206e6f64652e72656d6f7665417474726962757465286e616d65293b0a09097d0a0909656c73652069662028747970656f662076616c7565213d3d276f626a656374272026262021697346756e6374696f6e2876616c75652929207b0a090909696620286e7329206e6f64652e7365744174747269627574654e532827687474703a2f2f7777772e77332e6f72672f313939392f786c696e6b272c20746f4c6f77657243617365286e735b315d292c2076616c7565293b0a090909656c7365206e6f64652e736574417474726962757465286e616d652c2076616c7565293b0a09097d0a097d0a7d0a0a0a2f2a2a20417474656d707420746f20736574206120444f4d2070726f706572747920746f2074686520676976656e2076616c75652e0a202a0949452026204646207468726f7720666f72206365727461696e2070726f70657274792d76616c756520636f6d62696e6174696f6e732e0a202a2f0a66756e6374696f6e2073657450726f7065727479286e6f64652c206e616d652c2076616c756529207b0a09747279207b0a09096e6f64655b6e616d655d203d2076616c75653b0a097d20636174636820286529207b207d0a7d0a0a0a2f2a2a2050726f787920616e206576656e7420746f20686f6f6b6564206576656e742068616e646c6572730a202a0940707269766174650a202a2f0a66756e6374696f6e206576656e7450726f7879286529207b0a0972657475726e20746869732e5f6c697374656e6572735b652e747970655d286f7074696f6e732e6576656e74202626206f7074696f6e732e6576656e74286529207c7c2065293b0a7d0a0a0a2f2a2a204765742061206e6f646527732061747472696275746573206173206120686173686d61702e0a202a0940707269766174650a202a2f0a66756e6374696f6e206765745261774e6f646541747472696275746573286e6f646529207b0a09766172206174747273203d207b7d3b0a09666f72202876617220693d6e6f64652e617474726962757465732e6c656e6774683b20692d2d3b2029207b0a090961747472735b6e6f64652e617474726962757465735b695d2e6e616d655d203d206e6f64652e617474726962757465735b695d2e76616c75653b0a097d0a0972657475726e2061747472733b0a7d0a0a2f2a2a20436865636b2069662074776f206e6f64657320617265206571756976616c656e742e0a202a0940706172616d207b456c656d656e747d206e6f64650a202a0940706172616d207b564e6f64657d20766e6f64650a202a0940707269766174650a202a2f0a66756e6374696f6e20697353616d654e6f646554797065286e6f64652c20766e6f646529207b0a09696620286973537472696e67243128766e6f64652929207b0a090972657475726e206765744e6f646554797065286e6f6465293d3d3d333b0a097d0a09696620286973537472696e67243128766e6f64652e6e6f64654e616d652929207b0a090972657475726e2069734e616d65644e6f6465286e6f64652c20766e6f64652e6e6f64654e616d65293b0a097d0a0969662028697346756e6374696f6e28766e6f64652e6e6f64654e616d652929207b0a090972657475726e206e6f64652e5f636f6d706f6e656e74436f6e7374727563746f723d3d3d766e6f64652e6e6f64654e616d65207c7c20697346756e6374696f6e616c436f6d706f6e656e7428766e6f6465293b0a097d0a7d0a0a0a66756e6374696f6e2069734e616d65644e6f6465286e6f64652c206e6f64654e616d6529207b0a0972657475726e206e6f64652e6e6f726d616c697a65644e6f64654e616d653d3d3d6e6f64654e616d65207c7c20746f4c6f77657243617365286e6f64652e6e6f64654e616d65293d3d3d746f4c6f77657243617365286e6f64654e616d65293b0a7d0a0a0a2f2a2a0a202a205265636f6e73747275637420436f6d706f6e656e742d7374796c65206070726f7073602066726f6d206120564e6f64652e0a202a20456e73757265732064656661756c742f66616c6c6261636b2076616c7565732066726f6d206064656661756c7450726f7073603a0a202a204f776e2d70726f70657274696573206f66206064656661756c7450726f707360206e6f742070726573656e7420696e2060766e6f64652e6174747269627574657360206172652061646465642e0a202a2040706172616d207b564e6f64657d20766e6f64650a202a204072657475726e73207b4f626a6563747d2070726f70730a202a2f0a66756e6374696f6e206765744e6f646550726f707328766e6f646529207b0a097661722064656661756c7450726f7073203d20766e6f64652e6e6f64654e616d652e64656661756c7450726f70732c0a090970726f7073203d20636c6f6e652864656661756c7450726f7073207c7c20766e6f64652e61747472696275746573293b0a0a096966202864656661756c7450726f70732920657874656e642870726f70732c20766e6f64652e61747472696275746573293b0a0a0969662028766e6f64652e6368696c6472656e292070726f70732e6368696c6472656e203d20766e6f64652e6368696c6472656e3b0a0a0972657475726e2070726f70733b0a7d0a0a2f2a2a20444f4d206e6f646520706f6f6c2c206b65796564206f6e206e6f64654e616d652e202a2f0a0a766172206e6f6465732432203d207b7d3b0a0a66756e6374696f6e20636f6c6c6563744e6f6465286e6f646529207b0a09636c65616e4e6f6465286e6f6465293b0a09766172206e616d65203d20746f4c6f77657243617365286e6f64652e6e6f64654e616d65292c0a09096c697374203d206e6f64657324325b6e616d655d3b0a09696620286c69737429206c6973742e70757368286e6f6465293b0a09656c7365206e6f64657324325b6e616d655d203d205b6e6f64655d3b0a7d0a0a0a66756e6374696f6e206372656174654e6f6465286e6f64654e616d652c20697353766729207b0a09766172206e616d65203d20746f4c6f77657243617365286e6f64654e616d65292c0a09096e6f6465203d206e6f64657324325b6e616d655d202626206e6f64657324325b6e616d655d2e706f702829207c7c20286973537667203f20646f63756d656e742e637265617465456c656d656e744e532827687474703a2f2f7777772e77332e6f72672f323030302f737667272c206e6f64654e616d6529203a20646f63756d656e742e637265617465456c656d656e74286e6f64654e616d6529293b0a09656e737572654e6f646544617461286e6f6465293b0a096e6f64652e6e6f726d616c697a65644e6f64654e616d65203d206e616d653b0a0972657475726e206e6f64653b0a7d0a0a0a66756e6374696f6e20636c65616e4e6f6465286e6f646529207b0a0972656d6f76654e6f6465286e6f6465293b0a0a09696620286765744e6f646554797065286e6f646529213d3d31292072657475726e3b0a0a092f2f205768656e207265636c61696d696e672065787465726e616c6c792063726561746564206e6f6465732c207365656420746865206174747269627574652063616368653a2028497373756520233937290a0a09656e737572654e6f646544617461286e6f64652c206765745261774e6f646541747472696275746573286e6f646529293b0a0a096e6f64652e5f636f6d706f6e656e74203d206e6f64652e5f636f6d706f6e656e74436f6e7374727563746f72203d206e756c6c3b0a0a092f2f20696620286e6f64652e6368696c644e6f6465732e6c656e6774683e3029207b0a092f2f2009636f6e736f6c652e747261636528605761726e696e673a2052656379636c657220636f6c6c656374696e67203c247b6e6f64652e6e6f64654e616d657d3e207769746820247b6e6f64652e6368696c644e6f6465732e6c656e6774687d206368696c6472656e2e60293b0a092f2f2009666f7220286c657420693d6e6f64652e6368696c644e6f6465732e6c656e6774683b20692d2d3b202920636f6c6c6563744e6f6465286e6f64652e6368696c644e6f6465735b695d293b0a092f2f207d0a7d0a0a2f2a2a204469666620726563757273696f6e20636f756e742c207573656420746f20747261636b2074686520656e64206f66207468652064696666206379636c652e202a2f0a766172206d6f756e7473203d205b5d3b0a0a2f2a2a204469666620726563757273696f6e20636f756e742c207573656420746f20747261636b2074686520656e64206f66207468652064696666206379636c652e202a2f0a76617220646966664c6576656c203d20303b0a0a7661722069735376674d6f6465203d2066616c73653b0a0a0a66756e6374696f6e20666c7573684d6f756e74732829207b0a0976617220633b0a097768696c65202828633d6d6f756e74732e706f7028292929207b0a090969662028632e636f6d706f6e656e744469644d6f756e742920632e636f6d706f6e656e744469644d6f756e7428293b0a097d0a7d0a0a0a2f2a2a204170706c7920646966666572656e63657320696e206120676976656e20766e6f64652028616e6420697427732064656570206368696c6472656e2920746f2061207265616c20444f4d204e6f64652e0a202a0940706172616d207b456c656d656e747d205b646f6d3d6e756c6c5d09094120444f4d206e6f646520746f206d757461746520696e746f20746865207368617065206f66207468652060766e6f6465600a202a0940706172616d207b564e6f64657d20766e6f64650909094120564e6f64652028776974682064657363656e64616e747320666f726d696e67206120747265652920726570726573656e74696e6720746865206465736972656420444f4d207374727563747572650a202a094072657475726e73207b456c656d656e747d20646f6d09090954686520637265617465642f6d75746174656420656c656d656e740a202a0940707269766174650a202a2f0a66756e6374696f6e206469666628646f6d2c20766e6f64652c20636f6e746578742c206d6f756e74416c6c2c20706172656e742c20726f6f74436f6d706f6e656e742c206e6578745369626c696e6729207b0a09646966664c6576656c2b2b3b0a0976617220726574203d20696469666628646f6d2c20766e6f64652c20636f6e746578742c206d6f756e74416c6c2c20726f6f74436f6d706f6e656e74293b0a0969662028706172656e74202626207265742e706172656e744e6f6465213d3d706172656e7429207b0a0909706172656e742e696e736572744265666f7265287265742c206e6578745369626c696e67207c7c206e756c6c293b0a097d0a0969662028212d2d646966664c6576656c2920666c7573684d6f756e747328293b0a0972657475726e207265743b0a7d0a0a0a66756e6374696f6e20696469666628646f6d2c20766e6f64652c20636f6e746578742c206d6f756e74416c6c2c20726f6f74436f6d706f6e656e7429207b0a09766172206f726967696e616c41747472696275746573203d20766e6f646520262620766e6f64652e617474726962757465733b0a0a097768696c652028697346756e6374696f6e616c436f6d706f6e656e7428766e6f64652929207b0a0909766e6f6465203d206275696c6446756e6374696f6e616c436f6d706f6e656e7428766e6f64652c20636f6e74657874293b0a097d0a0a0969662028656d70747928766e6f64652929207b0a0909766e6f6465203d2027273b0a090969662028726f6f74436f6d706f6e656e7429207b0a09090969662028646f6d29207b0a0909090969662028646f6d2e6e6f6465547970653d3d3d38292072657475726e20646f6d3b0a09090909636f6c6c6563744e6f646528646f6d293b0a0909097d0a09090972657475726e20646f63756d656e742e637265617465436f6d6d656e7428766e6f6465293b0a09097d0a097d0a0a09696620286973537472696e67243128766e6f64652929207b0a090969662028646f6d29207b0a090909696620286765744e6f64655479706528646f6d293d3d3d3320262620646f6d2e706172656e744e6f646529207b0a09090909646f6d2e6e6f646556616c7565203d20766e6f64653b0a0909090972657475726e20646f6d3b0a0909097d0a090909636f6c6c6563744e6f646528646f6d293b0a09097d0a090972657475726e20646f63756d656e742e637265617465546578744e6f646528766e6f6465293b0a097d0a0a09766172206f7574203d20646f6d2c0a09096e6f64654e616d65203d20766e6f64652e6e6f64654e616d652c0a09097376674d6f64653b0a0a0969662028697346756e6374696f6e286e6f64654e616d652929207b0a090972657475726e206275696c64436f6d706f6e656e7446726f6d564e6f646528646f6d2c20766e6f64652c20636f6e746578742c206d6f756e74416c6c293b0a097d0a0a0969662028216973537472696e672431286e6f64654e616d652929207b0a09096e6f64654e616d65203d20537472696e67286e6f64654e616d65293b0a097d0a0a097376674d6f6465203d20746f4c6f77657243617365286e6f64654e616d65293d3d3d27737667273b0a0a09696620287376674d6f6465292069735376674d6f6465203d20747275653b0a0a096966202821646f6d29207b0a09096f7574203d206372656174654e6f6465286e6f64654e616d652c2069735376674d6f6465293b0a097d0a09656c736520696620282169734e616d65644e6f646528646f6d2c206e6f64654e616d652929207b0a09096f7574203d206372656174654e6f6465286e6f64654e616d652c2069735376674d6f6465293b0a09092f2f206d6f7665206368696c6472656e20696e746f20746865207265706c6163656d656e74206e6f64650a09097768696c652028646f6d2e66697273744368696c6429206f75742e617070656e644368696c6428646f6d2e66697273744368696c64293b0a09092f2f207265636c61696d20656c656d656e74206e6f6465730a09097265636f6c6c6563744e6f64655472656528646f6d293b0a097d0a0a092f2f20666173742d7061746820666f7220656c656d656e747320636f6e7461696e696e6720612073696e676c6520546578744e6f64653a0a0969662028766e6f64652e6368696c6472656e20262620766e6f64652e6368696c6472656e2e6c656e6774683d3d3d3120262620747970656f6620766e6f64652e6368696c6472656e5b305d3d3d3d27737472696e6727202626206f75742e6368696c644e6f6465732e6c656e6774683d3d3d31202626206f75742e66697273744368696c6420696e7374616e63656f66205465787429207b0a09096f75742e66697273744368696c642e6e6f646556616c7565203d20766e6f64652e6368696c6472656e5b305d3b0a097d0a09656c73652069662028766e6f64652e6368696c6472656e207c7c206f75742e66697273744368696c6429207b0a0909696e6e6572446966664e6f6465286f75742c20766e6f64652e6368696c6472656e2c20636f6e746578742c206d6f756e74416c6c293b0a097d0a0a096469666641747472696275746573286f75742c20766e6f64652e61747472696275746573293b0a0a09696620286f726967696e616c41747472696275746573202626206f726967696e616c417474726962757465732e72656629207b0a0909286f75745b415454525f4b45595d2e726566203d206f726967696e616c417474726962757465732e72656629286f7574293b0a097d0a0a09696620287376674d6f6465292069735376674d6f6465203d2066616c73653b0a0a0972657475726e206f75743b0a7d0a0a0a2f2a2a204170706c79206368696c6420616e6420617474726962757465206368616e676573206265747765656e206120564e6f646520616e64206120444f4d204e6f646520746f2074686520444f4d2e202a2f0a66756e6374696f6e20696e6e6572446966664e6f646528646f6d2c20766368696c6472656e2c20636f6e746578742c206d6f756e74416c6c29207b0a09766172206f726967696e616c4368696c6472656e203d20646f6d2e6368696c644e6f6465732c0a09096368696c6472656e203d205b5d2c0a09096b65796564203d207b7d2c0a09096b657965644c656e203d20302c0a09096d696e203d20302c0a09096c656e203d206f726967696e616c4368696c6472656e2e6c656e6774682c0a09096368696c6472656e4c656e203d20302c0a0909766c656e203d20766368696c6472656e20262620766368696c6472656e2e6c656e6774682c0a09096a2c20632c20766368696c642c206368696c643b0a0a09696620286c656e29207b0a0909666f72202876617220693d303b20693c6c656e3b20692b2b29207b0a090909766172206368696c642431203d206f726967696e616c4368696c6472656e5b695d2c0a090909096b6579203d20766c656e203f20282863203d206368696c6424312e5f636f6d706f6e656e7429203f20632e5f5f6b6579203a202863203d206368696c6424315b415454525f4b45595d29203f20632e6b6579203a206e756c6c29203a206e756c6c3b0a090909696620286b6579207c7c206b65793d3d3d3029207b0a090909096b657965644c656e2b2b3b0a090909096b657965645b6b65795d203d206368696c6424313b0a0909097d0a090909656c7365207b0a090909096368696c6472656e5b6368696c6472656e4c656e2b2b5d203d206368696c6424313b0a0909097d0a09097d0a097d0a0a0969662028766c656e29207b0a0909666f722028766172206924313d303b206924313c766c656e3b206924312b2b29207b0a090909766368696c64203d20766368696c6472656e5b6924315d3b0a0909096368696c64203d206e756c6c3b0a0a0909092f2f2069662028697346756e6374696f6e616c436f6d706f6e656e7428766368696c642929207b0a0909092f2f2009766368696c64203d206275696c6446756e6374696f6e616c436f6d706f6e656e7428766368696c64293b0a0909092f2f207d0a0a0909092f2f20617474656d707420746f2066696e642061206e6f6465206261736564206f6e206b6579206d61746368696e670a090909696620286b657965644c656e20262620766368696c642e6174747269627574657329207b0a09090909766172206b65792431203d20766368696c642e6b65793b0a090909096966202821656d707479286b6579243129202626206b6579243120696e206b6579656429207b0a09090909096368696c64203d206b657965645b6b657924315d3b0a09090909096b657965645b6b657924315d203d20756e646566696e65643b0a09090909096b657965644c656e2d2d3b0a090909097d0a0909097d0a0a0909092f2f20617474656d707420746f20706c75636b2061206e6f6465206f66207468652073616d6520747970652066726f6d20746865206578697374696e67206368696c6472656e0a09090969662028216368696c64202626206d696e3c6368696c6472656e4c656e29207b0a09090909666f7220286a3d6d696e3b206a3c6368696c6472656e4c656e3b206a2b2b29207b0a090909090963203d206368696c6472656e5b6a5d3b0a0909090909696620286320262620697353616d654e6f64655479706528632c20766368696c642929207b0a0909090909096368696c64203d20633b0a0909090909096368696c6472656e5b6a5d203d20756e646566696e65643b0a090909090909696620286a3d3d3d6368696c6472656e4c656e2d3129206368696c6472656e4c656e2d2d3b0a090909090909696620286a3d3d3d6d696e29206d696e2b2b3b0a090909090909627265616b3b0a09090909097d0a090909097d0a0909097d0a0a0909092f2f206d6f72706820746865206d6174636865642f666f756e642f6372656174656420444f4d206368696c6420746f206d6174636820766368696c64202864656570290a0909096368696c64203d206964696666286368696c642c20766368696c642c20636f6e746578742c206d6f756e74416c6c293b0a0a090909696620286368696c64213d3d6f726967696e616c4368696c6472656e5b6924315d29207b0a09090909646f6d2e696e736572744265666f7265286368696c642c206f726967696e616c4368696c6472656e5b6924315d207c7c206e756c6c293b0a0909097d0a09097d0a097d0a0a0a09696620286b657965644c656e29207b0a09092f2a65736c696e742067756172642d666f722d696e3a302a2f0a0909666f7220287661722069243220696e206b657965642920696620286b657965645b6924325d29207b0a0909096368696c6472656e5b6d696e3d6368696c6472656e4c656e2b2b5d203d206b657965645b6924325d3b0a09097d0a097d0a0a092f2f2072656d6f7665206f727068616e6564206368696c6472656e0a09696620286d696e3c6368696c6472656e4c656e29207b0a090972656d6f76654f727068616e65644368696c6472656e286368696c6472656e293b0a097d0a7d0a0a0a2f2a2a205265636c61696d206368696c6472656e2074686174207765726520756e7265666572656e63656420696e207468652064657369726564205654726565202a2f0a66756e6374696f6e2072656d6f76654f727068616e65644368696c6472656e286368696c6472656e2c20756e6d6f756e744f6e6c7929207b0a09666f72202876617220693d6368696c6472656e2e6c656e6774683b20692d2d3b2029207b0a0909766172206368696c64203d206368696c6472656e5b695d3b0a0909696620286368696c6429207b0a0909097265636f6c6c6563744e6f646554726565286368696c642c20756e6d6f756e744f6e6c79293b0a09097d0a097d0a7d0a0a0a2f2a2a205265636c61696d20616e20656e746972652074726565206f66206e6f6465732c207374617274696e672061742074686520726f6f742e202a2f0a66756e6374696f6e207265636f6c6c6563744e6f646554726565286e6f64652c20756e6d6f756e744f6e6c7929207b0a092f2f2040544f444f3a204e65656420746f206d616b6520612063616c6c206f6e2077686574686572205072656163742073686f756c642072656d6f7665206e6f646573206e6f74206372656174656420627920697473656c662e0a092f2f2043757272656e746c79206974202a646f65732a2072656d6f7665207468656d2e2044697363757373696f6e3a2068747470733a2f2f6769746875622e636f6d2f646576656c6f7069742f7072656163742f6973737565732f33390a092f2f69662028216e6f64655b415454525f4b45595d292072657475726e3b0a0a0976617220636f6d706f6e656e74203d206e6f64652e5f636f6d706f6e656e743b0a0969662028636f6d706f6e656e7429207b0a0909756e6d6f756e74436f6d706f6e656e7428636f6d706f6e656e742c2021756e6d6f756e744f6e6c79293b0a097d0a09656c7365207b0a0909696620286e6f64655b415454525f4b45595d202626206e6f64655b415454525f4b45595d2e72656629206e6f64655b415454525f4b45595d2e726566286e756c6c293b0a0a09096966202821756e6d6f756e744f6e6c7929207b0a0a090909636f6c6c6563744e6f6465286e6f6465293b0a09097d0a0a0909696620286e6f64652e6368696c644e6f646573202626206e6f64652e6368696c644e6f6465732e6c656e67746829207b0a09090972656d6f76654f727068616e65644368696c6472656e286e6f64652e6368696c644e6f6465732c20756e6d6f756e744f6e6c79293b0a09097d0a097d0a7d0a0a0a2f2a2a204170706c7920646966666572656e63657320696e20617474726962757465732066726f6d206120564e6f646520746f2074686520676976656e20444f4d204e6f64652e202a2f0a66756e6374696f6e20646966664174747269627574657328646f6d2c20617474727329207b0a09766172206f6c64203d20646f6d5b415454525f4b45595d207c7c206765745261774e6f64654174747269627574657328646f6d293b0a0a092f2f2072656d6f76654174747269627574657328646f6d2c206f6c642c206174747273207c7c20454d505459293b0a09666f722028766172206e616d6520696e206f6c6429207b0a090969662028216174747273207c7c2021286e616d6520696e2061747472732929207b0a0909097365744163636573736f7228646f6d2c206e616d652c206e756c6c2c206f6c645b6e616d655d2c2069735376674d6f6465293b0a09097d0a097d0a0a092f2f206e6577202620757064617465640a0969662028617474727329207b0a0909666f722028766172206e616d65243120696e20617474727329207b0a0909096966202821286e616d65243120696e206f6c6429207c7c2061747472735b6e616d6524315d213d6f6c645b6e616d6524315d207c7c2028286e616d6524313d3d3d2776616c756527207c7c206e616d6524313d3d3d27636865636b656427292026262061747472735b6e616d6524315d213d646f6d5b6e616d6524315d2929207b0a090909097365744163636573736f7228646f6d2c206e616d6524312c2061747472735b6e616d6524315d2c206f6c645b6e616d6524315d2c2069735376674d6f6465293b0a0909097d0a09097d0a097d0a7d0a0a2f2a2a2052657461696e73206120706f6f6c206f6620436f6d706f6e656e747320666f722072652d7573652c206b65796564206f6e20636f6d706f6e656e74206e616d652e0a202a094e6f74653a2073696e636520636f6d706f6e656e74206e616d657320617265206e6f7420756e69717565206f72206576656e206e65636573736172696c7920617661696c61626c652c20746865736520617265207072696d6172696c79206120666f726d206f66207368617264696e672e0a202a0940707269766174650a202a2f0a76617220636f6d706f6e656e7473203d207b7d3b0a0a0a66756e6374696f6e20636f6c6c656374436f6d706f6e656e7428636f6d706f6e656e7429207b0a09766172206e616d65203d20636f6d706f6e656e742e636f6e7374727563746f722e6e616d652c0a09096c697374203d20636f6d706f6e656e74735b6e616d655d3b0a09696620286c69737429206c6973742e7075736828636f6d706f6e656e74293b0a09656c736520636f6d706f6e656e74735b6e616d655d203d205b636f6d706f6e656e745d3b0a7d0a0a0a66756e6374696f6e20637265617465436f6d706f6e656e742843746f722c2070726f70732c20636f6e7465787429207b0a0976617220696e7374203d206e65772043746f722870726f70732c20636f6e74657874292c0a09096c697374203d20636f6d706f6e656e74735b43746f722e6e616d655d3b0a09696e73742e70726f7073203d2070726f70733b0a09696e73742e636f6e74657874203d20636f6e746578743b0a09696620286c69737429207b0a0909666f72202876617220693d6c6973742e6c656e6774683b20692d2d3b2029207b0a090909696620286c6973745b695d2e636f6e7374727563746f723d3d3d43746f7229207b0a09090909696e73742e6e65787442617365203d206c6973745b695d2e6e657874426173653b0a090909096c6973742e73706c69636528692c2031293b0a09090909627265616b3b0a0909097d0a09097d0a097d0a0972657475726e20696e73743b0a7d0a0a2f2a2a204d61726b20636f6d706f6e656e7420617320646972747920616e6420717565756520757020612072656e6465722e0a202a0940706172616d207b436f6d706f6e656e747d20636f6d706f6e656e740a202a0940707269766174650a202a2f0a66756e6374696f6e2074726967676572436f6d706f6e656e7452656e64657228636f6d706f6e656e7429207b0a096966202821636f6d706f6e656e742e5f646972747929207b0a0909636f6d706f6e656e742e5f6469727479203d20747275653b0a0909656e717565756552656e64657228636f6d706f6e656e74293b0a097d0a7d0a0a0a0a2f2a2a20536574206120636f6d706f6e656e742773206070726f707360202867656e6572616c6c7920646572697665642066726f6d204a53582061747472696275746573292e0a202a0940706172616d207b4f626a6563747d2070726f70730a202a0940706172616d207b4f626a6563747d205b6f7074735d0a202a0940706172616d207b626f6f6c65616e7d205b6f7074732e72656e64657253796e633d66616c73655d0949662060747275656020616e64207b406c696e6b206f7074696f6e732e73796e63436f6d706f6e656e74557064617465737d206973206074727565602c2074726967676572732073796e6368726f6e6f75732072656e646572696e672e0a202a0940706172616d207b626f6f6c65616e7d205b6f7074732e72656e6465723d747275655d0909094966206066616c7365602c206e6f2072656e6465722077696c6c206265207472696767657265642e0a202a2f0a66756e6374696f6e20736574436f6d706f6e656e7450726f707328636f6d706f6e656e742c2070726f70732c206f7074732c20636f6e746578742c206d6f756e74416c6c29207b0a097661722062203d20636f6d706f6e656e742e626173653b0a0969662028636f6d706f6e656e742e5f64697361626c6552656e646572696e67292072657475726e3b0a09636f6d706f6e656e742e5f64697361626c6552656e646572696e67203d20747275653b0a0a096966202828636f6d706f6e656e742e5f5f726566203d2070726f70732e72656629292064656c6574652070726f70732e7265663b0a096966202828636f6d706f6e656e742e5f5f6b6579203d2070726f70732e6b657929292064656c6574652070726f70732e6b65793b0a0a0969662028656d707479286229207c7c206d6f756e74416c6c29207b0a090969662028636f6d706f6e656e742e636f6d706f6e656e7457696c6c4d6f756e742920636f6d706f6e656e742e636f6d706f6e656e7457696c6c4d6f756e7428293b0a097d0a09656c73652069662028636f6d706f6e656e742e636f6d706f6e656e7457696c6c5265636569766550726f707329207b0a0909636f6d706f6e656e742e636f6d706f6e656e7457696c6c5265636569766550726f70732870726f70732c20636f6e74657874293b0a097d0a0a0969662028636f6e7465787420262620636f6e74657874213d3d636f6d706f6e656e742e636f6e7465787429207b0a09096966202821636f6d706f6e656e742e70726576436f6e746578742920636f6d706f6e656e742e70726576436f6e74657874203d20636f6d706f6e656e742e636f6e746578743b0a0909636f6d706f6e656e742e636f6e74657874203d20636f6e746578743b0a097d0a0a096966202821636f6d706f6e656e742e7072657650726f70732920636f6d706f6e656e742e7072657650726f7073203d20636f6d706f6e656e742e70726f70733b0a09636f6d706f6e656e742e70726f7073203d2070726f70733b0a0a09636f6d706f6e656e742e5f64697361626c6552656e646572696e67203d2066616c73653b0a0a09696620286f707473213d3d4e4f5f52454e44455229207b0a0909696620286f7074733d3d3d53594e435f52454e444552207c7c206f7074696f6e732e73796e63436f6d706f6e656e7455706461746573213d3d66616c7365207c7c20216229207b0a09090972656e646572436f6d706f6e656e7428636f6d706f6e656e742c2053594e435f52454e4445522c206d6f756e74416c6c293b0a09097d0a0909656c7365207b0a09090974726967676572436f6d706f6e656e7452656e64657228636f6d706f6e656e74293b0a09097d0a097d0a0a0969662028636f6d706f6e656e742e5f5f7265662920636f6d706f6e656e742e5f5f72656628636f6d706f6e656e74293b0a7d0a0a0a0a2f2a2a2052656e646572206120436f6d706f6e656e742c2074726967676572696e67206e6563657373617279206c6966656379636c65206576656e747320616e642074616b696e6720486967682d4f7264657220436f6d706f6e656e747320696e746f206163636f756e742e0a202a0940706172616d207b436f6d706f6e656e747d20636f6d706f6e656e740a202a0940706172616d207b4f626a6563747d205b6f7074735d0a202a0940706172616d207b626f6f6c65616e7d205b6f7074732e6275696c643d66616c73655d09094966206074727565602c20636f6d706f6e656e742077696c6c206275696c6420616e642073746f7265206120444f4d206e6f6465206966206e6f7420616c7265616479206173736f6369617465642077697468206f6e652e0a202a0940707269766174650a202a2f0a66756e6374696f6e2072656e646572436f6d706f6e656e7428636f6d706f6e656e742c206f7074732c206d6f756e74416c6c29207b0a0969662028636f6d706f6e656e742e5f64697361626c6552656e646572696e67292072657475726e3b0a0a0976617220736b69702c2072656e64657265642c0a090970726f7073203d20636f6d706f6e656e742e70726f70732c0a09097374617465203d20636f6d706f6e656e742e73746174652c0a0909636f6e74657874203d20636f6d706f6e656e742e636f6e746578742c0a090970726576696f757350726f7073203d20636f6d706f6e656e742e7072657650726f7073207c7c2070726f70732c0a090970726576696f75735374617465203d20636f6d706f6e656e742e707265765374617465207c7c2073746174652c0a090970726576696f7573436f6e74657874203d20636f6d706f6e656e742e70726576436f6e74657874207c7c20636f6e746578742c0a09096973557064617465203d20636f6d706f6e656e742e626173652c0a0909696e697469616c42617365203d206973557064617465207c7c20636f6d706f6e656e742e6e657874426173652c0a090962617365506172656e74203d20696e697469616c4261736520262620696e697469616c426173652e706172656e744e6f64652c0a0909696e697469616c436f6d706f6e656e74203d20696e697469616c4261736520262620696e697469616c426173652e5f636f6d706f6e656e742c0a0909696e697469616c4368696c64436f6d706f6e656e74203d20636f6d706f6e656e742e5f636f6d706f6e656e743b0a0a092f2f206966207570646174696e670a0969662028697355706461746529207b0a0909636f6d706f6e656e742e70726f7073203d2070726576696f757350726f70733b0a0909636f6d706f6e656e742e7374617465203d2070726576696f757353746174653b0a0909636f6d706f6e656e742e636f6e74657874203d2070726576696f7573436f6e746578743b0a0909696620286f707473213d3d464f5243455f52454e4445520a090909262620636f6d706f6e656e742e73686f756c64436f6d706f6e656e745570646174650a090909262620636f6d706f6e656e742e73686f756c64436f6d706f6e656e745570646174652870726f70732c2073746174652c20636f6e7465787429203d3d3d2066616c736529207b0a090909736b6970203d20747275653b0a09097d0a0909656c73652069662028636f6d706f6e656e742e636f6d706f6e656e7457696c6c55706461746529207b0a090909636f6d706f6e656e742e636f6d706f6e656e7457696c6c5570646174652870726f70732c2073746174652c20636f6e74657874293b0a09097d0a0909636f6d706f6e656e742e70726f7073203d2070726f70733b0a0909636f6d706f6e656e742e7374617465203d2073746174653b0a0909636f6d706f6e656e742e636f6e74657874203d20636f6e746578743b0a097d0a0a09636f6d706f6e656e742e7072657650726f7073203d20636f6d706f6e656e742e707265765374617465203d20636f6d706f6e656e742e70726576436f6e74657874203d20636f6d706f6e656e742e6e65787442617365203d206e756c6c3b0a09636f6d706f6e656e742e5f6469727479203d2066616c73653b0a0a096966202821736b697029207b0a090969662028636f6d706f6e656e742e72656e646572292072656e6465726564203d20636f6d706f6e656e742e72656e6465722870726f70732c2073746174652c20636f6e74657874293b0a0a09092f2f20636f6e7465787420746f207061737320746f20746865206368696c642c2063616e20626520757064617465642076696120286772616e642d29706172656e7420636f6d706f6e656e740a090969662028636f6d706f6e656e742e6765744368696c64436f6e7465787429207b0a090909636f6e74657874203d20657874656e6428636c6f6e6528636f6e74657874292c20636f6d706f6e656e742e6765744368696c64436f6e746578742829293b0a09097d0a0a09097768696c652028697346756e6374696f6e616c436f6d706f6e656e742872656e64657265642929207b0a09090972656e6465726564203d206275696c6446756e6374696f6e616c436f6d706f6e656e742872656e64657265642c20636f6e74657874293b0a09097d0a0a0909766172206368696c64436f6d706f6e656e74203d2072656e64657265642026262072656e64657265642e6e6f64654e616d652c0a090909746f556e6d6f756e742c20626173653b0a0a090969662028697346756e6374696f6e286368696c64436f6d706f6e656e7429202626206368696c64436f6d706f6e656e742e70726f746f747970652e72656e64657229207b0a0909092f2f207365742075702068696768206f7264657220636f6d706f6e656e74206c696e6b0a0a09090976617220696e7374203d20696e697469616c4368696c64436f6d706f6e656e742c0a090909096368696c6450726f7073203d206765744e6f646550726f70732872656e6465726564293b0a0a09090969662028696e737420262620696e73742e636f6e7374727563746f723d3d3d6368696c64436f6d706f6e656e7429207b0a09090909736574436f6d706f6e656e7450726f707328696e73742c206368696c6450726f70732c2053594e435f52454e4445522c20636f6e74657874293b0a0909097d0a090909656c7365207b0a09090909746f556e6d6f756e74203d20696e73743b0a09090909696e7374203d20637265617465436f6d706f6e656e74286368696c64436f6d706f6e656e742c206368696c6450726f70732c20636f6e74657874293b0a09090909696e73742e5f706172656e74436f6d706f6e656e74203d20636f6d706f6e656e743b0a09090909636f6d706f6e656e742e5f636f6d706f6e656e74203d20696e73743b0a09090909736574436f6d706f6e656e7450726f707328696e73742c206368696c6450726f70732c204e4f5f52454e4445522c20636f6e74657874293b0a0909090972656e646572436f6d706f6e656e7428696e73742c2053594e435f52454e444552293b0a0909097d0a0a09090962617365203d20696e73742e626173653b0a09097d0a0909656c7365207b0a090909766172206362617365203d20696e697469616c426173653b0a0a0909092f2f2064657374726f792068696768206f7264657220636f6d706f6e656e74206c696e6b0a090909746f556e6d6f756e74203d20696e697469616c4368696c64436f6d706f6e656e743b0a09090969662028746f556e6d6f756e7429207b0a090909096362617365203d20636f6d706f6e656e742e5f636f6d706f6e656e74203d206e756c6c3b0a0909097d0a0a09090969662028696e697469616c42617365207c7c206f7074733d3d3d53594e435f52454e44455229207b0a09090909696620286362617365292063626173652e5f636f6d706f6e656e74203d206e756c6c3b0a0909090962617365203d20646966662863626173652c2072656e64657265642c20636f6e746578742c206d6f756e74416c6c207c7c202169735570646174652c2062617365506172656e742c20747275652c20696e697469616c4261736520262620696e697469616c426173652e6e6578745369626c696e67293b0a0909097d0a09097d0a0a090969662028696e697469616c426173652026262062617365213d3d696e697469616c4261736529207b0a0909096966202821746f556e6d6f756e7420262620696e697469616c436f6d706f6e656e743d3d3d636f6d706f6e656e742026262021696e697469616c4368696c64436f6d706f6e656e7420262620696e697469616c426173652e706172656e744e6f646529207b0a09090909696e697469616c426173652e5f636f6d706f6e656e74203d206e756c6c3b0a090909097265636f6c6c6563744e6f64655472656528696e697469616c42617365293b0a0909097d0a09097d0a0a090969662028746f556e6d6f756e7429207b0a090909756e6d6f756e74436f6d706f6e656e7428746f556e6d6f756e742c2074727565293b0a09097d0a0a0909636f6d706f6e656e742e62617365203d20626173653b0a0909696620286261736529207b0a09090976617220636f6d706f6e656e74526566203d20636f6d706f6e656e742c0a0909090974203d20636f6d706f6e656e743b0a0909097768696c65202828743d742e5f706172656e74436f6d706f6e656e742929207b20636f6d706f6e656e74526566203d20743b207d0a090909626173652e5f636f6d706f6e656e74203d20636f6d706f6e656e745265663b0a090909626173652e5f636f6d706f6e656e74436f6e7374727563746f72203d20636f6d706f6e656e745265662e636f6e7374727563746f723b0a09097d0a0a097d0a0a0969662028216973557064617465207c7c206d6f756e74416c6c29207b0a09096d6f756e74732e756e736869667428636f6d706f6e656e74293b0a09096966202821646966664c6576656c2920666c7573684d6f756e747328293b0a097d0a09656c7365206966202821736b697020262620636f6d706f6e656e742e636f6d706f6e656e7444696455706461746529207b0a0909636f6d706f6e656e742e636f6d706f6e656e744469645570646174652870726576696f757350726f70732c2070726576696f757353746174652c2070726576696f7573436f6e74657874293b0a097d0a0a09766172206362203d20636f6d706f6e656e742e5f72656e64657243616c6c6261636b732c20666e3b0a0969662028636229207768696c6520282028666e203d2063622e706f70282929202920666e2e63616c6c28636f6d706f6e656e74293b0a0a0972657475726e2072656e64657265643b0a7d0a0a0a0a2f2a2a204170706c792074686520436f6d706f6e656e74207265666572656e636564206279206120564e6f646520746f2074686520444f4d2e0a202a0940706172616d207b456c656d656e747d20646f6d0954686520444f4d206e6f646520746f206d75746174650a202a0940706172616d207b564e6f64657d20766e6f6465094120436f6d706f6e656e742d7265666572656e63696e6720564e6f64650a202a094072657475726e73207b456c656d656e747d20646f6d0954686520637265617465642f6d75746174656420656c656d656e740a202a0940707269766174650a202a2f0a66756e6374696f6e206275696c64436f6d706f6e656e7446726f6d564e6f646528646f6d2c20766e6f64652c20636f6e746578742c206d6f756e74416c6c29207b0a097661722063203d20646f6d20262620646f6d2e5f636f6d706f6e656e742c0a09096f6c64446f6d203d20646f6d2c0a090969734469726563744f776e6572203d206320262620646f6d2e5f636f6d706f6e656e74436f6e7374727563746f723d3d3d766e6f64652e6e6f64654e616d652c0a090969734f776e6572203d2069734469726563744f776e65722c0a090970726f7073203d206765744e6f646550726f707328766e6f6465293b0a097768696c65202863202626202169734f776e65722026262028633d632e5f706172656e74436f6d706f6e656e742929207b0a090969734f776e6572203d20632e636f6e7374727563746f723d3d3d766e6f64652e6e6f64654e616d653b0a097d0a0a096966202869734f776e65722026262028216d6f756e74416c6c207c7c20632e5f636f6d706f6e656e742929207b0a0909736574436f6d706f6e656e7450726f707328632c2070726f70732c204153594e435f52454e4445522c20636f6e746578742c206d6f756e74416c6c293b0a0909646f6d203d20632e626173653b0a097d0a09656c7365207b0a09096966202863202626202169734469726563744f776e657229207b0a090909756e6d6f756e74436f6d706f6e656e7428632c2074727565293b0a090909646f6d203d206f6c64446f6d203d206e756c6c3b0a09097d0a0a090963203d20637265617465436f6d706f6e656e7428766e6f64652e6e6f64654e616d652c2070726f70732c20636f6e74657874293b0a090969662028646f6d2026262021632e6e657874426173652920632e6e65787442617365203d20646f6d3b0a0909736574436f6d706f6e656e7450726f707328632c2070726f70732c2053594e435f52454e4445522c20636f6e746578742c206d6f756e74416c6c293b0a0909646f6d203d20632e626173653b0a0a0909696620286f6c64446f6d20262620646f6d213d3d6f6c64446f6d29207b0a0909096f6c64446f6d2e5f636f6d706f6e656e74203d206e756c6c3b0a0909097265636f6c6c6563744e6f646554726565286f6c64446f6d293b0a09097d0a097d0a0a0972657475726e20646f6d3b0a7d0a0a0a0a2f2a2a2052656d6f7665206120636f6d706f6e656e742066726f6d2074686520444f4d20616e642072656379636c652069742e0a202a0940706172616d207b456c656d656e747d20646f6d0909094120444f4d206e6f64652066726f6d20776869636820746f20756e6d6f756e742074686520676976656e20436f6d706f6e656e740a202a0940706172616d207b436f6d706f6e656e747d20636f6d706f6e656e740954686520436f6d706f6e656e7420696e7374616e636520746f20756e6d6f756e740a202a0940707269766174650a202a2f0a66756e6374696f6e20756e6d6f756e74436f6d706f6e656e7428636f6d706f6e656e742c2072656d6f766529207b0a092f2f20636f6e736f6c652e6c6f672860247b72656d6f76653f2752656d6f76696e67273a27556e6d6f756e74696e67277d20636f6d706f6e656e743a20247b636f6d706f6e656e742e636f6e7374727563746f722e6e616d657d60293b0a097661722062617365203d20636f6d706f6e656e742e626173653b0a0a09636f6d706f6e656e742e5f64697361626c6552656e646572696e67203d20747275653b0a0a0969662028636f6d706f6e656e742e636f6d706f6e656e7457696c6c556e6d6f756e742920636f6d706f6e656e742e636f6d706f6e656e7457696c6c556e6d6f756e7428293b0a0a09636f6d706f6e656e742e62617365203d206e756c6c3b0a0a092f2f207265637572736976656c79207465617220646f776e2026207265636f6c6c65637420686967682d6f7264657220636f6d706f6e656e74206368696c6472656e3a0a0976617220696e6e6572203d20636f6d706f6e656e742e5f636f6d706f6e656e743b0a0969662028696e6e657229207b0a0909756e6d6f756e74436f6d706f6e656e7428696e6e65722c2072656d6f7665293b0a097d0a09656c736520696620286261736529207b0a090969662028626173655b415454525f4b45595d20262620626173655b415454525f4b45595d2e7265662920626173655b415454525f4b45595d2e726566286e756c6c293b0a0a0909636f6d706f6e656e742e6e65787442617365203d20626173653b0a0a09096966202872656d6f766529207b0a09090972656d6f76654e6f64652862617365293b0a090909636f6c6c656374436f6d706f6e656e7428636f6d706f6e656e74293b0a09097d0a090972656d6f76654f727068616e65644368696c6472656e28626173652e6368696c644e6f6465732c202172656d6f7665293b0a097d0a0a0969662028636f6d706f6e656e742e5f5f7265662920636f6d706f6e656e742e5f5f726566286e756c6c293b0a0969662028636f6d706f6e656e742e636f6d706f6e656e74446964556e6d6f756e742920636f6d706f6e656e742e636f6d706f6e656e74446964556e6d6f756e7428293b0a7d0a0a2f2a2a204261736520436f6d706f6e656e7420636c6173732c20666f722068652045533620436c617373206d6574686f64206f66206372656174696e6720436f6d706f6e656e74730a202a09407075626c69630a202a0a202a09406578616d706c650a202a09636c617373204d79466f6f20657874656e647320436f6d706f6e656e74207b0a202a090972656e6465722870726f70732c20737461746529207b0a202a09090972657475726e203c646976202f3e3b0a202a09097d0a202a097d0a202a2f0a66756e6374696f6e20436f6d706f6e656e742870726f70732c20636f6e7465787429207b0a092f2a2a204070726976617465202a2f0a09746869732e5f6469727479203d20747275653b0a092f2a2a20407075626c6963202a2f0a09746869732e5f64697361626c6552656e646572696e67203d2066616c73653b0a092f2a2a20407075626c6963202a2f0a09746869732e707265765374617465203d20746869732e7072657650726f7073203d20746869732e70726576436f6e74657874203d20746869732e62617365203d20746869732e6e65787442617365203d20746869732e5f706172656e74436f6d706f6e656e74203d20746869732e5f636f6d706f6e656e74203d20746869732e5f5f726566203d20746869732e5f5f6b6579203d20746869732e5f6c696e6b6564537461746573203d20746869732e5f72656e64657243616c6c6261636b73203d206e756c6c3b0a092f2a2a20407075626c6963202a2f0a09746869732e636f6e74657874203d20636f6e746578743b0a092f2a2a204074797065207b6f626a6563747d202a2f0a09746869732e70726f7073203d2070726f70733b0a092f2a2a204074797065207b6f626a6563747d202a2f0a09746869732e7374617465203d20746869732e676574496e697469616c537461746520262620746869732e676574496e697469616c53746174652829207c7c207b7d3b0a7d0a0a0a657874656e6428436f6d706f6e656e742e70726f746f747970652c207b0a0a092f2a2a2052657475726e7320612060626f6f6c65616e602076616c756520696e6469636174696e672069662074686520636f6d706f6e656e742073686f756c642072652d72656e646572207768656e20726563656976696e672074686520676976656e206070726f70736020616e6420607374617465602e0a09202a0940706172616d207b6f626a6563747d206e65787450726f70730a09202a0940706172616d207b6f626a6563747d206e65787453746174650a09202a0940706172616d207b6f626a6563747d206e657874436f6e746578740a09202a094072657475726e73207b426f6f6c65616e7d2073686f756c642074686520636f6d706f6e656e742072652d72656e6465720a09202a09406e616d652073686f756c64436f6d706f6e656e745570646174650a09202a094066756e6374696f6e0a09202a2f0a092f2f2073686f756c64436f6d706f6e656e745570646174652829207b0a092f2f200972657475726e20747275653b0a092f2f207d2c0a0a0a092f2a2a2052657475726e7320612066756e6374696f6e2074686174207365747320612073746174652070726f7065727479207768656e2063616c6c65642e0a09202a0943616c6c696e67206c696e6b537461746528292072657065617465646c792077697468207468652073616d6520617267756d656e74732072657475726e73206120636163686564206c696e6b2066756e6374696f6e2e0a09202a0a09202a0950726f766964657320736f6d65206275696c742d696e207370656369616c2063617365733a0a09202a09092d20436865636b626f78657320616e6420726164696f20627574746f6e73206c696e6b20746865697220626f6f6c65616e2060636865636b6564602076616c75650a09202a09092d20496e70757473206175746f6d61746963616c6c79206c696e6b207468656972206076616c7565602070726f70657274790a09202a09092d204576656e742070617468732066616c6c206261636b20746f20616e79206173736f63696174656420436f6d706f6e656e74206966206e6f7420666f756e64206f6e20616e20656c656d656e740a09202a09092d204966206c696e6b65642076616c756520697320612066756e6374696f6e2c2077696c6c20696e766f6b6520697420616e64207573652074686520726573756c740a09202a0a09202a0940706172616d207b737472696e677d206b657909090909546865207061746820746f20736574202d2063616e206265206120646f742d6e6f74617465642064656570206b65790a09202a0940706172616d207b737472696e677d205b6576656e74506174685d09094966207365742c20617474656d70747320746f2066696e6420746865206e65772073746174652076616c7565206174206120676976656e20646f742d6e6f746174656420706174682077697468696e20746865206f626a6563742070617373656420746f20746865206c696e6b65645374617465207365747465722e0a09202a094072657475726e73207b66756e6374696f6e7d206c696e6b53746174655365747465722865290a09202a0a09202a09406578616d706c65205570646174652061202274657874222073746174652076616c7565207768656e20616e20696e707574206368616e6765733a0a09202a09093c696e707574206f6e4368616e67653d7b20746869732e6c696e6b53746174652827746578742729207d202f3e0a09202a0a09202a09406578616d706c6520536574206120646565702073746174652076616c7565206f6e20636c69636b0a09202a09093c627574746f6e206f6e436c69636b3d7b20746869732e6c696e6b53746174652827746f7563682e636f6f726473272c2027746f75636865732e302729207d3e5461703c2f627574746f6e0a09202a2f0a096c696e6b53746174653a2066756e6374696f6e206c696e6b5374617465286b65792c206576656e745061746829207b0a09097661722063203d20746869732e5f6c696e6b6564537461746573207c7c2028746869732e5f6c696e6b6564537461746573203d207b7d292c0a09090963616368654b6579203d206b6579202b20277c27202b206576656e74506174683b0a090972657475726e20635b63616368654b65795d207c7c2028635b63616368654b65795d203d206372656174654c696e6b6564537461746528746869732c206b65792c206576656e745061746829293b0a097d2c0a0a0a092f2a2a2055706461746520636f6d706f6e656e7420737461746520627920636f7079696e672070726f706572746965732066726f6d206073746174656020746f2060746869732e7374617465602e0a09202a0940706172616d207b6f626a6563747d2073746174650909412068617368206f662073746174652070726f7065727469657320746f207570646174652077697468206e65772076616c7565730a09202a2f0a0973657453746174653a2066756e6374696f6e2073657453746174652873746174652c2063616c6c6261636b29207b0a09097661722073203d20746869732e73746174653b0a09096966202821746869732e7072657653746174652920746869732e707265765374617465203d20636c6f6e652873293b0a0909657874656e6428732c20697346756e6374696f6e28737461746529203f20737461746528732c20746869732e70726f707329203a207374617465293b0a09096966202863616c6c6261636b292028746869732e5f72656e64657243616c6c6261636b73203d2028746869732e5f72656e64657243616c6c6261636b73207c7c205b5d29292e707573682863616c6c6261636b293b0a090974726967676572436f6d706f6e656e7452656e6465722874686973293b0a097d2c0a0a0a092f2a2a20496d6d6564696174656c7920706572666f726d20612073796e6368726f6e6f75732072652d72656e646572206f662074686520636f6d706f6e656e742e0a09202a0940707269766174650a09202a2f0a09666f7263655570646174653a2066756e6374696f6e20666f7263655570646174652829207b0a090972656e646572436f6d706f6e656e7428746869732c20464f5243455f52454e444552293b0a097d2c0a0a0a092f2a2a2041636365707473206070726f70736020616e6420607374617465602c20616e642072657475726e732061206e6577205669727475616c20444f4d207472656520746f206275696c642e0a09202a095669727475616c20444f4d2069732067656e6572616c6c7920636f6e737472756374656420766961205b4a53585d28687474703a2f2f6a61736f6e666f726d61742e636f6d2f7774662d69732d6a7378292e0a09202a0940706172616d207b6f626a6563747d2070726f7073090950726f7073202865673a204a53582061747472696275746573292072656365697665642066726f6d20706172656e7420656c656d656e742f636f6d706f6e656e740a09202a0940706172616d207b6f626a6563747d207374617465090954686520636f6d706f6e656e7427732063757272656e742073746174650a09202a0940706172616d207b6f626a6563747d20636f6e746578740909436f6e74657874206f626a65637420286966206120706172656e7420636f6d706f6e656e74206861732070726f766964656420636f6e74657874290a09202a094072657475726e7320564e6f64650a09202a2f0a0972656e6465723a2066756e6374696f6e2072656e6465722829207b0a090972657475726e206e756c6c3b0a097d0a0a7d293b0a0a2f2a2a2052656e646572204a535820696e746f20612060706172656e746020456c656d656e742e0a202a0940706172616d207b564e6f64657d20766e6f646509094120284a53582920564e6f646520746f2072656e6465720a202a0940706172616d207b456c656d656e747d20706172656e740909444f4d20656c656d656e7420746f2072656e64657220696e746f0a202a0940706172616d207b456c656d656e747d205b6d657267655d09417474656d707420746f2072652d75736520616e206578697374696e6720444f4d207472656520726f6f74656420617420606d65726765600a202a09407075626c69630a202a0a202a09406578616d706c650a202a092f2f2072656e64657220612064697620696e746f203c626f64793e3a0a202a0972656e646572283c6469762069643d2268656c6c6f223e68656c6c6f213c2f6469763e2c20646f63756d656e742e626f6479293b0a202a0a202a09406578616d706c650a202a092f2f2072656e646572206120225468696e672220636f6d706f6e656e7420696e746f2023666f6f3a0a202a09636f6e7374205468696e67203d20287b206e616d65207d29203d3e203c7370616e3e7b206e616d65207d3c2f7370616e3e3b0a202a0972656e646572283c5468696e67206e616d653d226f6e6522202f3e2c20646f63756d656e742e717565727953656c6563746f72282723666f6f2729293b0a202a2f0a66756e6374696f6e2072656e64657228766e6f64652c20706172656e742c206d6572676529207b0a0972657475726e2064696666286d657267652c20766e6f64652c207b7d2c2066616c73652c20706172656e74293b0a7d0a0a76617220636c69656e74203d20637265617465436f6d6d6f6e6a734d6f64756c652866756e6374696f6e20286d6f64756c6529207b0a6d6f64756c652e6578706f727473203d2066756e6374696f6e2028636f6d6d616e642c206461746129207b0a202020200a202020202f2f2057726170206f757220706f73744d65737361676520696e20612070726f6d69736520746f20616c6c6f7720757320746f20636861696e20636f6d6d616e647320616e640a202020202f2f20726573706f6e73657320746f6765746865722e0a2020200a2020202072657475726e206e65772050726f6d6973652866756e6374696f6e202866756c66696c6c2c2072656a65637429207b0a2020202020202020766172206d6573736167654368616e6e656c203d206e6577204d6573736167654368616e6e656c28293b0a20202020202020206d6573736167654368616e6e656c2e706f7274312e6f6e6d657373616765203d2066756e6374696f6e20286576656e7429207b0a20202020202020202020202076617220726566203d206576656e742e646174613b0a20202020202020202020202076617220657272203d207265665b305d3b0a2020202020202020202020207661722064617461203d207265665b315d3b0a2020202020202020202020206966202865727229207b0a2020202020202020202020202020202072657475726e2072656a65637428657272293b0a2020202020202020202020207d0a2020202020202020202020200a20202020202020202020202066756c66696c6c2864617461293b0a20202020202020207d3b0a20202020202020200a202020202020202076617220646174614173537472696e67203d204a534f4e2e737472696e676966792864617461293b0a2020202020200a20202020202020206e6176696761746f722e73657276696365576f726b65722e72656164792e7468656e2866756e6374696f6e202872656729207b0a202020202020202020202020636f6e736f6c652e696e666f28282253656e64696e672022202b20636f6d6d616e64202b202220746f207365727669636520776f726b65722e2e2e22292c2064617461293b0a2020202020202020202020207265672e6163746976652e706f73744d657373616765287b0a20202020202020202020202020202020616374696f6e3a202272756e436f6d6d616e64222c0a20202020202020202020202020202020636f6d6d616e643a20636f6d6d616e642c0a20202020202020202020202020202020646174614173537472696e673a20646174614173537472696e670a2020202020202020202020207d2c205b6d6573736167654368616e6e656c2e706f7274325d293b0a20202020202020207d290a20202020202020200a202020207d290a7d0a7d293b0a0a7661722072756e53657276696365576f726b6572436f6d6d616e64203d20696e7465726f7044656661756c7428636c69656e74293b0a0a66756e6374696f6e20636865636b4e6f74696669636174696f6e5065726d697373696f6e202829207b0a2020202072657475726e206e65772050726f6d6973652866756e6374696f6e202866756c66696c6c2c2072656a65637429207b0a20202020202020206966202877696e646f772e4e6f74696669636174696f6e2e7065726d697373696f6e203d3d3d20276772616e7465642729207b0a20202020202020202020202072657475726e2066756c66696c6c2874727565293b0a20202020202020207d0a20202020202020204e6f74696669636174696f6e2e726571756573745065726d697373696f6e2866756e6374696f6e202873746174757329207b0a20202020202020202020202069662028737461747573203d3d3d20276772616e7465642729207b0a2020202020202020202020202020202072657475726e2066756c66696c6c2874727565293b0a2020202020202020202020207d0a20202020202020202020202072656a656374286e6577204572726f722873746174757329290a20202020202020207d290a202020207d293b0a7d3b0a0a7661722052656d6f74654e6f74696679203d202866756e6374696f6e2028436f6d706f6e656e7429207b0a2020202066756e6374696f6e2052656d6f74654e6f74696679202829207b0a2020202020202020436f6d706f6e656e742e6170706c7928746869732c20617267756d656e7473293b0a202020207d0a0a202020206966202820436f6d706f6e656e7420292052656d6f74654e6f746966792e5f5f70726f746f5f5f203d20436f6d706f6e656e743b0a2020202052656d6f74654e6f746966792e70726f746f74797065203d204f626a6563742e6372656174652820436f6d706f6e656e7420262620436f6d706f6e656e742e70726f746f7479706520293b0a2020202052656d6f74654e6f746966792e70726f746f747970652e636f6e7374727563746f72203d2052656d6f74654e6f746966793b0a0a2020202052656d6f74654e6f746966792e70726f746f747970652e72656e646572203d2066756e6374696f6e2072656e646572202829207b0a0a202020202020202076617220627574746f6e436c617373203d205b22627574746f6e225d3b0a0a202020202020202069662028746869732e73746174652e69735375627363726962656429207b0a202020202020202020202020627574746f6e436c6173732e7075736828227375627363726962656422293b0a20202020202020207d0a0a202020202020202072657475726e20280a20202020202020202020202068282027646976272c207b20636c6173733a20627574746f6e436c6173732e6a6f696e28222022292c206f6e436c69636b3a20746869732e7375627363726962654f72556e7375627363726962652e62696e64287468697329207d2c202253756273637269626520746f207465737420746f70696322290a2020202020202020290a202020207d3b0a0a2020202052656d6f74654e6f746966792e70726f746f747970652e7375627363726962654f72556e737562736372696265203d2066756e6374696f6e207375627363726962654f72556e737562736372696265202829207b0a20202020202020206966202877696e646f772e6c6f63616c53746f726167655b22746573745f73756273637269626564225d29207b0a20202020202020202020202072657475726e20746869732e756e73756273637269626528293b0a20202020202020207d0a0a202020202020202072657475726e20746869732e737562736372696265546f54657374546f70696328290a202020207d3b0a0a2020202052656d6f74654e6f746966792e70726f746f747970652e737562736372696265546f54657374546f706963203d2066756e6374696f6e20737562736372696265546f54657374546f706963202829207b0a202020202020202076617220746869732431203d20746869733b0a0a202020202020202072657475726e20636865636b4e6f74696669636174696f6e5065726d697373696f6e28290a20202020202020202e7468656e2866756e6374696f6e202829207b0a20202020202020202020202072657475726e206e6176696761746f722e73657276696365576f726b65722e72656164790a20202020202020207d290a20202020202020202e7468656e2866756e6374696f6e202872656729207b0a202020202020202020202020636f6e736f6c652e6c6f672822676f74207265672c2073656e64696e6720707573686d616e616765722073756273637269626522290a20202020202020202020202072657475726e207265672e707573684d616e616765722e737562736372696265287b7573657256697369626c654f6e6c793a20747275657d290a2020202020202020202020202e7468656e2866756e6374696f6e202829207b0a2020202020202020202020202020202072657475726e2072756e53657276696365576f726b6572436f6d6d616e642827707573686b696e46697265626173652e737562736372696265546f546f706963272c207b0a2020202020202020202020202020202020202020746f7069633a20276170702d64656d6f2d74657374272c0a2020202020202020202020202020202020202020636f6e6669726d6174696f6e4e6f74696669636174696f6e3a207b0a20202020202020202020202020202020202020202020202074746c3a2036302c0a2020202020202020202020202020202020202020202020207061796c6f61643a205b7b0a20202020202020202020202020202020202020202020202020202020636f6d6d616e643a20226e6f74696669636174696f6e2e73686f77222c0a202020202020202020202020202020202020202020202020202020206f7074696f6e733a207b0a20202020202020202020202020202020202020202020202020202020202020207469746c653a2022537562736372697074696f6e20636f6e6669726d6174696f6e222c0a20202020202020202020202020202020202020202020202020202020202020206f7074696f6e733a207b0a202020202020202020202020202020202020202020202020202020202020202020202020626f64793a20225468697320636f6e6669726d73207468617420796f752068617665207375636365737366756c6c79207375627363726962656420746f2074686520746f7069632e220a20202020202020202020202020202020202020202020202020202020202020207d0a202020202020202020202020202020202020202020202020202020207d0a2020202020202020202020202020202020202020202020207d5d2c0a202020202020202020202020202020202020202020202020736572766963655f776f726b65725f75726c3a207265672e6163746976652e73637269707455524c2c0a2020202020202020202020202020202020202020202020207072696f726974793a202768696768270a20202020202020202020202020202020202020207d0a202020202020202020202020202020207d293b0a2020202020202020202020207d293b0a20202020202020207d290a20202020202020202e7468656e2866756e6374696f6e202829207b0a20202020202020202020202077696e646f772e6c6f63616c53746f726167655b22746573745f73756273637269626564225d203d20747275653b0a2020202020202020202020207468697324312e7365745374617465287b0a202020202020202020202020202020206973537562736372696265643a20747275650a2020202020202020202020207d293b0a20202020202020207d290a20202020202020202e63617463682866756e6374696f6e202865727229207b0a202020202020202020202020636f6e736f6c652e6572726f7228657272290a20202020202020207d290a202020207d3b0a0a2020202052656d6f74654e6f746966792e70726f746f747970652e756e737562736372696265203d2066756e6374696f6e20756e737562736372696265202829207b0a202020202020202076617220746869732431203d20746869733b0a0a2020202020202020636f6e736f6c652e6c6f672827756e73756227290a202020202020202072657475726e2072756e53657276696365576f726b6572436f6d6d616e642827707573686b696e46697265626173652e756e73756273637269626546726f6d546f706963272c207b0a202020202020202020202020746f7069633a20276170702d64656d6f2d74657374270a20202020202020207d290a20202020202020202e7468656e2866756e6374696f6e202829207b0a20202020202020202020202077696e646f772e6c6f63616c53746f726167652e72656d6f76654974656d2822746573745f7375627363726962656422293b0a2020202020202020202020207468697324312e7365745374617465287b0a202020202020202020202020202020206973537562736372696265643a2066616c73650a2020202020202020202020207d293b0a20202020202020207d290a202020207d3b0a0a2020202052656d6f74654e6f746966792e70726f746f747970652e636f6d706f6e656e744469644d6f756e74203d2066756e6374696f6e20636f6d706f6e656e744469644d6f756e74202829207b0a2020202020202020746869732e7365745374617465287b0a2020202020202020202020206973537562736372696265643a2077696e646f772e6c6f63616c53746f726167655b22746573745f73756273637269626564225d0a20202020202020207d290a202020207d3b0a0a2020202072657475726e2052656d6f74654e6f746966793b0a7d28436f6d706f6e656e7429293b0a0a766172206261736550617468203d20222f726561646572223b0a766172206e6f74696669636174696f6e436f6d6d616e647353657474696e6773203d207b22707573686b696e4669726562617365223a7b22686f7374223a2268747470733a2f2f7777772e7374672e67646e6d6f62696c656c61622e636f6d2f70757368222c226b6579223a2237326a6a4e4f76655959645763324f707636613849706936654d754f34363865227d7d3b0a76617220636f6e666967203d207b0a0962617365506174683a2062617365506174682c0a096e6f74696669636174696f6e436f6d6d616e647353657474696e67733a206e6f74696669636174696f6e436f6d6d616e647353657474696e67730a7d3b0a0a66756e6374696f6e204c61796f7574202870726f707329207b0a0a20202020766172206261636b427574746f6e203d206e756c6c3b0a2020202076617220636f6e7461696e6572436c6173736573203d20226d646c2d6c61796f7574206d646c2d6c61796f75742d2d66697865642d686561646572223b0a0a202020206966202870726f70732e64656661756c744261636b55524c29207b0a20202020202020206261636b427574746f6e203d206828202761272c207b20687265663a2070726f70732e64656661756c744261636b55524c2c20636c6173733a20226d646c2d6c61796f75745f5f6472617765722d627574746f6e22207d2c0a202020202020202020206828202769272c207b20636c6173733a20226d6174657269616c2d69636f6e7322207d2c20226172726f775f6261636b22290a20202020202020202020293b0a202020207d20656c7365207b0a2020202020202020636f6e7461696e6572436c6173736573202b3d2022206d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e223b0a202020207d0a0a202020200a2020202072657475726e2068282027646976272c207b20636c6173733a20636f6e7461696e6572436c6173736573207d2c0a202020202020202068282027686561646572272c207b20636c6173733a20226d646c2d6c61796f75745f5f68656164657222207d2c0a2020202020202020202020206261636b427574746f6e2c0a20202020202020202020202068282027646976272c207b20636c6173733a20226d646c2d6c61796f75745f5f6865616465722d726f7722207d2c0a202020202020202020202020202020200a20202020202020202020202020202020682820277370616e272c207b20636c6173733a20226d646c2d6c61796f75742d7469746c6522207d2c2070726f70732e7469746c65290a202020202020202020202020290a2020202020202020292c0a2020202020202020682820276d61696e272c207b20636c6173733a20226d646c2d6c61796f75745f5f636f6e74656e7422207d2c0a202020202020202070726f70732e6368696c6472656e0a2020202020202020290a20202020290a7d0a0a7661722077726170496e48544d4c203d2066756e6374696f6e2028636f6e74656e742c2070726f707329207b0a0a2020202076617220707265666978203d20222f223b0a2020202069662028636f6e6669672e626173655061746829207b0a2020202020202020707265666978203d20636f6e6669672e62617365506174683b0a202020207d0a0a20202020766172206261636b55524c546167203d206e756c6c3b0a0a202020206966202870726f70732e64656661756c744261636b55524c29207b0a20202020202020206261636b55524c546167203d20682820276d657461272c207b206e616d653a202264656661756c742d6261636b2d75726c222c20636f6e74656e743a2070726f70732e64656661756c744261636b55524c207d290a202020207d0a0a2020202076617220636c617373436865636b536372697074203d20225c6e202020202020202069662028747970656f66206e6176696761746f7220213d3d205c22756e646566696e65645c22202626206e6176696761746f722e757365724167656e742e696e6465784f66285c22687962726964776562766965775c2229203e202d3129207b5c6e202020202020202020202020646f63756d656e742e646f63756d656e74456c656d656e742e636c6173734e616d65203d205c22696f732d6879627269645c225c6e20202020202020207d5c6e20202020223b0a0a2020202072657475726e20280a20202020202020206828202768746d6c272c206e756c6c2c0a2020202020202020202020206828202768656164272c206e756c6c2c0a20202020202020202020202020202020682820277469746c65272c206e756c6c2c2070726f70732e7469746c6520292c0a20202020202020202020202020202020682820276c696e6b272c207b20687265663a202268747470733a2f2f666f6e74732e676f6f676c65617069732e636f6d2f69636f6e3f66616d696c793d4d6174657269616c2b49636f6e73222c2072656c3a20227374796c65736865657422207d292c0a20202020202020202020202020202020682820276c696e6b272c207b2072656c3a20226d616e6966657374222c20687265663a20222e2f6d616e69666573742e6a736f6e22207d292c0a20202020202020202020202020202020682820276c696e6b272c207b2072656c3a20227374796c657368656574222c20687265663a20707265666978202b20222f7374796c65732e637373222c20747970653a2022746578742f63737322207d292c0a20202020202020202020202020202020682820276d657461272c207b206e616d653a202276696577706f7274222c20636f6e74656e743a202277696474683d6465766963652d77696474682c20696e697469616c2d7363616c653d312c757365722d7363616c61626c653d6e6f22207d292c0a20202020202020202020202020202020682820276d657461272c207b206e616d653a20227468656d652d636f6c6f72222c20636f6e74656e743a2070726f70732e7468656d65436f6c6f72207c7c20222330443632393222207d292c0a20202020202020202020202020202020682820276d657461272c207b20636861727365743a20227574662d3822207d292c20200a202020202020202020202020202020206261636b55524c5461672c0a2020202020202020202020202020202068282027736372697074272c207b2064616e6765726f75736c79536574496e6e657248544d4c3a207b5f5f68746d6c3a20636c617373436865636b5363726970747d207d290a202020202020202020202020292c0a20202020202020202020202068282027626f6479272c206e756c6c2c0a20202020202020202020202068282027646976272c207b2069643a20226d61696e22207d2c0a20202020202020202020202020202020636f6e74656e740a202020202020202020202020290a202020202020202020202020292c0a20202020202020202020202068282027736372697074272c207b207372633a20707265666978202b20222f636c69656e742e6a73222c206173796e633a2074727565207d292c0a20202020202020202020202068282027736372697074272c207b206173796e633a2074727565207d2c0a2020202020202020202020202020202028226e6176696761746f722e73657276696365576f726b65722e7265676973746572282722202b20707265666978202b20222f73772e6a73272c207b73636f70653a202722202b20707265666978202b20222f277d293b22290a202020202020202020202020290a2020202020202020290a20202020290a7d0a0a66756e6374696f6e205061676557726170706572202870726f707329207b0a0a2020202076617220636f6e74656e74203d20280a20202020202020206828204c61796f75742c2070726f70732c0a20202020202020202020202070726f70732e6368696c6472656e0a2020202020202020290a20202020293b0a0a2020202069662028747970656f662077696e646f7720213d3d2022756e646566696e65642229207b0a202020202020202072657475726e20636f6e74656e743b0a202020207d20656c7365207b0a202020202020202072657475726e2077726170496e48544d4c28636f6e74656e742c2070726f7073293b0a202020207d0a7d0a0a7661722053746f72794c697374203d202866756e6374696f6e2028436f6d706f6e656e7429207b0a2020202066756e6374696f6e2053746f72794c697374202829207b0a2020202020202020436f6d706f6e656e742e6170706c7928746869732c20617267756d656e7473293b0a202020207d0a0a202020206966202820436f6d706f6e656e7420292053746f72794c6973742e5f5f70726f746f5f5f203d20436f6d706f6e656e743b0a2020202053746f72794c6973742e70726f746f74797065203d204f626a6563742e6372656174652820436f6d706f6e656e7420262620436f6d706f6e656e742e70726f746f7479706520293b0a2020202053746f72794c6973742e70726f746f747970652e636f6e7374727563746f72203d2053746f72794c6973743b0a0a2020202053746f72794c6973742e70726f746f747970652e72656e646572203d2066756e6374696f6e2072656e646572202829207b0a202020202020202069662028746869732e70726f70732e73746f726965732e6c656e677468203d3d203029207b0a20202020202020202020202072657475726e206828202770272c206e756c6c2c20224e6f2073746f7269657320666f756e642e2220290a20202020202020207d0a2020202020202020636f6e736f6c652e6c6f6728276e756d626572206f662073746f72696573272c20746869732e70726f70732e73746f726965732e6c656e677468290a20202020202020207661722073746f72696573203d20746869732e70726f70732e73746f726965730a2020202020202020202020202e736f72742866756e6374696f6e2028612c6229207b2072657475726e20622e7075626c6973685f64617465202d20612e7075626c6973685f646174653b207d290a2020202020202020202020202e6d61702866756e6374696f6e202873746f727929207b0a0a20202020202020202020202020202020766172207469746c6543617264203d206e756c6c3b0a0a202020202020202020202020202020206966202873746f72792e696d61676529207b0a20202020202020202020202020202020202020207469746c6543617264203d20682820277370616e272c207b20636c6173733a20226d646c2d636172645f5f7469746c65206d646c2d636172642d2d657870616e6420696d67222c207374796c653a207b6261636b67726f756e64496d6167653a202275726c2822202b2073746f72792e696d616765202b202229227d207d293b0a202020202020202020202020202020207d20656c7365207b0a20202020202020202020202020202020202020207469746c6543617264203d20682820277370616e272c207b20636c6173733a20226d646c2d636172645f5f7469746c65206d646c2d636172642d2d657870616e6420696d6722207d290a202020202020202020202020202020207d0a0a0a2020202020202020202020202020202072657475726e206828202761272c207b20636c6173733a202273746f72792d636172642d696d616765206d646c2d63617264206d646c2d736861646f772d2d326470222c20687265663a202261727469636c65732f22202b2073746f72792e6964207d2c0a20202020202020202020202020202020202020207469746c65436172642c0a2020202020202020202020202020202020202020682820277370616e272c207b20636c6173733a20226d646c2d636172645f5f616374696f6e7322207d2c0a202020202020202020202020202020202020202020202020682820277370616e272c207b20636c6173733a2022617574686f7222207d2c2073746f72792e617574686f72292c0a202020202020202020202020202020202020202020202020682820277370616e272c207b20636c6173733a202264656d6f2d636172642d696d6167655f5f66696c656e616d6522207d2c2073746f72792e7469746c65290a2020202020202020202020202020202020202020290a20202020202020202020202020202020290a2020202020202020202020207d290a0a202020202020202072657475726e2068282027646976272c206e756c6c2c2073746f7269657320290a202020207d3b0a0a2020202072657475726e2053746f72794c6973743b0a7d28436f6d706f6e656e7429293b0a0a76617220537461747573506f707570203d202866756e6374696f6e2028436f6d706f6e656e7429207b0a2020202066756e6374696f6e20537461747573506f7075702829207b0a2020202020202020436f6d706f6e656e742e63616c6c2874686973293b0a2020202020202020746869732e7472616e736974696f6e656e64203d20746869732e7472616e736974696f6e656e642e62696e642874686973293b0a202020207d0a0a202020206966202820436f6d706f6e656e74202920537461747573506f7075702e5f5f70726f746f5f5f203d20436f6d706f6e656e743b0a20202020537461747573506f7075702e70726f746f74797065203d204f626a6563742e6372656174652820436f6d706f6e656e7420262620436f6d706f6e656e742e70726f746f7479706520293b0a20202020537461747573506f7075702e70726f746f747970652e636f6e7374727563746f72203d20537461747573506f7075703b0a0a20202020537461747573506f7075702e70726f746f747970652e72656e646572203d2066756e6374696f6e2072656e646572202829207b0a202020202020202069662028746869732e70726f70732e73686f7720213d3d207472756520262620746869732e73746174652e6973416e696d6174696e6720213d3d207472756529207b0a20202020202020202020202072657475726e206e756c6c3b0a20202020202020207d0a0a202020202020202076617220636c6173736573203d205b277374617475732d706f707570275d3b0a0a202020202020202069662028746869732e73746174652e61646453686f77436c617373203d3d3d207472756529207b0a202020202020202020202020636c61737365732e70757368282773686f7727293b0a20202020202020207d0a0a202020202020202072657475726e2068282027646976272c207b20636c6173733a20636c61737365732e6a6f696e2827202729207d2c0a20202020202020202020202068282027646976272c207b20636c6173733a2027696e6e657227207d2c0a20202020202020202020202020202020746869732e70726f70732e6d6573736167650a202020202020202020202020290a2020202020202020290a202020207d3b0a0a20202020537461747573506f7075702e70726f746f747970652e72656e646572436865636b203d2066756e6374696f6e2072656e646572436865636b202829207b0a20202020202020206966202821746869732e62617365292072657475726e3b0a0a202020202020202069662028746869732e70726f70732e73686f77203d3d3d207472756520262620746869732e73746174652e61646453686f77436c61737320213d3d207472756529207b0a2020202020202020202020202f2f207365656d7320746f20656e666f726365206974206472617773206f6e207468652073637265656e2c20736f20776520676574206f757220616e696d6174696f6e0a20202020202020202020202077696e646f772e676574436f6d70757465645374796c6528746869732e62617365292e7472616e73666f726d3b0a202020202020202020202020746869732e7365745374617465287b0a2020202020202020202020202020202061646453686f77436c6173733a20747275650a2020202020202020202020207d290a20202020202020207d0a202020207d3b0a0a20202020537461747573506f7075702e70726f746f747970652e636f6d706f6e656e744469644d6f756e74203d2066756e6374696f6e20636f6d706f6e656e744469644d6f756e74202829207b0a20202020202020746869732e72656e646572436865636b28293b0a202020207d3b0a0a20202020537461747573506f7075702e70726f746f747970652e636f6d706f6e656e74446964557064617465203d2066756e6374696f6e20636f6d706f6e656e74446964557064617465202829207b0a2020202020202020746869732e72656e646572436865636b28293b0a202020207d3b0a0a20202020537461747573506f7075702e70726f746f747970652e636f6d706f6e656e7457696c6c557064617465203d2066756e6374696f6e20636f6d706f6e656e7457696c6c55706461746520286e657750726f707329207b0a2020202020202020696620286e657750726f70732e73686f7720213d3d207472756520262620746869732e70726f70732e73686f77203d3d3d207472756529207b0a202020202020202020202020746869732e7365745374617465287b0a202020202020202020202020202020206973416e696d6174696e673a20747275652c0a2020202020202020202020202020202061646453686f77436c6173733a2066616c73650a2020202020202020202020207d293b0a0a202020202020202020202020746869732e626173652e6164644576656e744c697374656e657228277472616e736974696f6e656e64272c20746869732e7472616e736974696f6e656e64293b0a20202020202020207d0a202020207d3b0a0a20202020537461747573506f7075702e70726f746f747970652e7472616e736974696f6e656e64203d2066756e6374696f6e207472616e736974696f6e656e64202829207b0a2020202020202020746869732e626173652e72656d6f76654576656e744c697374656e657228277472616e736974696f6e656e64272c20746869732e7472616e736974696f6e656e64293b0a2020202020202020746869732e7365745374617465287b0a2020202020202020202020206973416e696d6174696e673a2066616c73650a20202020202020207d290a202020207d3b0a0a2020202072657475726e20537461747573506f7075703b0a7d28436f6d706f6e656e7429293b0a0a7661722065786563757465436f6d6d616e64203d206e756c6c3b0a0a66756e6374696f6e2072756e436f6d6d616e6428636f6d6d616e642c206f70747329207b0a202020206966202865786563757465436f6d6d616e64203d3d3d206e756c6c29207b0a20202020202020207468726f77206e6577204572726f722822547269656420746f2072756e20636f6d6d616e6420776974686f75742062696e64696e6720612072756e2066756e6374696f6e22293b0a202020207d0a2020202072657475726e2065786563757465436f6d6d616e6428636f6d6d616e642c206f707473293b0a7d0a0a66756e6374696f6e2073657452756e46756e6374696f6e2866756e6329207b0a2020202065786563757465436f6d6d616e64203d2066756e633b0a7d0a0a76617220486f6d6570616765203d202866756e6374696f6e2028436f6d706f6e656e7429207b0a20202066756e6374696f6e20486f6d65706167652870726f707329207b0a2020202020202020746869732e7374617465203d207b0a20202020202020202020202073746f726965733a2070726f70732e6578697374696e6753746f726965730a20202020202020207d0a202020207d0a0a2020206966202820436f6d706f6e656e74202920486f6d65706167652e5f5f70726f746f5f5f203d20436f6d706f6e656e743b0a202020486f6d65706167652e70726f746f74797065203d204f626a6563742e6372656174652820436f6d706f6e656e7420262620436f6d706f6e656e742e70726f746f7479706520293b0a202020486f6d65706167652e70726f746f747970652e636f6e7374727563746f72203d20486f6d65706167653b0a0a20202020486f6d65706167652e70726f746f747970652e72656e646572203d2066756e6374696f6e2072656e646572202829207b0a202020202020202072657475726e2068282027646976272c206e756c6c2c0a2020202020202020202020206828202770272c206e756c6c2c202257652061726520616e20696e6e6f766174696f6e207465616d20696e2074686520477561726469616e205553206e657773726f6f6d206578706c6f72696e672073746f727974656c6c696e6720616e642064656c69766572696e67206e657773206f6e20736d616c6c2073637265656e732e2220292c0a2020202020202020202020206828202770272c206e756c6c2c20225765276c6c206265207573696e6720746869732061707020746f2073656e6420796f75206f7572206c6174657374206578706572696d656e7420617320616e64207768656e20776520646f207468656d2c2062757420696e20746865206d65616e2074696d652c2074616b6520612072656164206f6620746865206578706572696d656e74732077652776652072756e206265666f72653a2220292c0a2020202020202020202020200a20202020202020202020202068282053746f72794c6973742c207b2073746f726965733a20746869732e73746174652e73746f72696573207d292c0a202020202020202020202020682820537461747573506f7075702c207b206d6573736167653a2022436865636b696e6720666f72206e65772073746f726965732e2e2e222c2073686f773a20746869732e73746174652e636865636b696e67207d290a2020202020202020290a202020207d3b0a0a20202020486f6d65706167652e70726f746f747970652e636f6d706f6e656e744469644d6f756e74203d2066756e6374696f6e20636f6d706f6e656e744469644d6f756e74202829207b0a202020202020202076617220746869732431203d20746869733b0a0a2020202020202020746869732e7365745374617465287b0a202020202020202020202020636865636b696e673a20747275650a20202020202020207d290a202020202020202072756e436f6d6d616e6428277265616465722e636865636b466f724e657727290a20202020202020202e7468656e2866756e6374696f6e2028616c6c4974656d7329207b0a2020202020202020202020207468697324312e7365745374617465287b0a2020202020202020202020202020202073746f726965733a20616c6c4974656d732c0a20202020202020202020202020202020636865636b696e673a2066616c73650a2020202020202020202020207d293b0a20202020202020207d290a20202020202020200a202020207d3b0a0a20202072657475726e20486f6d65706167653b0a7d28436f6d706f6e656e7429293b0a0a66756e6374696f6e20726f6f7420286529207b0a2020202072657475726e2072756e436f6d6d616e6428227472656f2e67657446726f6d53746f7265222c207b0a202020202020202073746f72653a202273746f72696573220a202020207d290a202020202e7468656e2866756e6374696f6e2028616c6c53746f7269657329207b0a202020202020202072657475726e2068282050616765577261707065722c207b2075726c3a20652e75726c2c207469746c653a2022477561726469616e204d6f62696c6520496e6e6f766174696f6e204c616222207d2c0a202020202020202020202020682820486f6d65706167652c207b206578697374696e6753746f726965733a20616c6c53746f72696573207d290a2020202020202020290a202020207d290a2020200a7d0a0a7661722041727469636c65203d202866756e6374696f6e2028436f6d706f6e656e7429207b0a2020202066756e6374696f6e2041727469636c65202829207b0a2020202020202020436f6d706f6e656e742e6170706c7928746869732c20617267756d656e7473293b0a202020207d0a0a202020206966202820436f6d706f6e656e7420292041727469636c652e5f5f70726f746f5f5f203d20436f6d706f6e656e743b0a2020202041727469636c652e70726f746f74797065203d204f626a6563742e6372656174652820436f6d706f6e656e7420262620436f6d706f6e656e742e70726f746f7479706520293b0a2020202041727469636c652e70726f746f747970652e636f6e7374727563746f72203d2041727469636c653b0a0a2020202041727469636c652e70726f746f747970652e72656e646572203d2066756e6374696f6e2072656e646572202829207b0a202020202020202072657475726e2068282027646976272c207b20636c6173733a202261727469636c6522207d2c0a202020202020202020202020682820276831272c206e756c6c2c20746869732e70726f70732e7469746c6520292c0a20202020202020202020202068282027646976272c207b2064616e6765726f75736c79536574496e6e657248544d4c3a207b5f5f68746d6c3a20746869732e70726f70732e636f6e74656e747d2c206f6e436c69636b3a20746869732e70726f63657373436c69636b207d290a2020202020202020290a202020207d3b0a0a2020202041727469636c652e70726f746f747970652e70726f63657373436c69636b203d2066756e6374696f6e2070726f63657373436c69636b20286529207b0a202020202020202069662028652e7461726765742e7461674e616d652e746f4c6f77657243617365282920213d3d2022612229207b0a20202020202020202020202072657475726e0a20202020202020207d0a0a202020202020202069662028652e7461726765742e686f73746e616d6520213d3d2077696e646f772e6c6f636174696f6e2e686f73746e616d6529207b0a202020202020202020202020652e7461726765742e746172676574203d20225f626c616e6b223b0a20202020202020207d0a202020207d3b0a0a2020202072657475726e2041727469636c653b0a7d28436f6d706f6e656e7429293b0a0a66756e6374696f6e2061727469636c6520286529207b0a2020202072657475726e2072756e436f6d6d616e6428227472656f2e67657446726f6d53746f7265222c207b0a202020202020202073746f72653a202273746f72696573222c0a202020202020202069643a20652e706172616d732e69640a202020207d290a202020202e7468656e2866756e6374696f6e202861727469636c6529207b0a2020202020202020636f6e736f6c652e6c6f67282767657420726573706f6e736527290a202020202020202072657475726e2068282050616765577261707065722c207b2075726c3a20652e75726c2c207469746c653a2061727469636c652e7469746c652c2064656661756c744261636b55524c3a20272e2e2f27207d2c0a20202020202020202020202068282041727469636c652c2061727469636c65290a2020202020202020290a202020207d290a202020200a7d0a0a76617220726f75746573203d207b0a20202020272f273a20726f6f742c0a20202020272f61727469636c65732f3a6964273a2061727469636c650a7d3b0a0a2f2f206d646c436f6d706f6e656e7448616e646c65722e6a73206465636c617265732074686973206f6e2077696e646f772e20497420776f6e277420657869737420696e0a2f2f207365727669636520776f726b6572732c20627574207765206f6e6c7920757365206974206f6e20636f6d706f6e656e744469644d6f756e74282920616e797761792e0a0a7661722068616e646c6572496e7374616e6365203d206e756c6c3b0a76617220636f6d706f6e656e7448616e646c65722432203d2066756e6374696f6e2829207b0a202020206966202868616e646c6572496e7374616e6365203d3d206e756c6c29207b0a20202020202020207468726f77206e6577204572726f7228224e6f20636f6d706f6e656e742068616e646c657220617661696c61626c6522293b0a202020207d0a2020202072657475726e2068616e646c6572496e7374616e63653b0a7d3b0a0a69662028747970656f662077696e646f7720213d3d2022756e646566696e65642229207b0a20202020636f6e736f6c652e6c6f6728277365742068616e646c657227293b0a2020202068616e646c6572496e7374616e6365203d2077696e646f772e636f6d706f6e656e7448616e646c65723b0a7d0a0a73657452756e46756e6374696f6e2872756e53657276696365576f726b6572436f6d6d616e64293b0a0a76617220726f75746572203d206e657720526f7574657228726f75746573293b0a0a7661722070617468546f4c6f6164203d2077696e646f772e6c6f636174696f6e2e706174686e616d653b0a0a69662028636f6e6669672e62617365506174682026262070617468546f4c6f61642e696e6465784f6628636f6e6669672e626173655061746829203d3d3d203029207b0a2020202070617468546f4c6f6164203d2070617468546f4c6f61642e73756273747228636f6e6669672e62617365506174682e6c656e677468293b0a7d0a0a726f757465722e64697370617463682870617468546f4c6f6164290a2e7468656e2866756e6374696f6e2028636f6d706f6e656e7429207b0a2020202072656e64657228636f6d706f6e656e742c206e756c6c2c20646f63756d656e742e676574456c656d656e744279496428226d61696e2229293b0a20202020636f6d706f6e656e7448616e646c6572243228292e75706772616465416c6c5265676973746572656428293b0a7d290a0a646f63756d656e742e6164644576656e744c697374656e65722822746f7563687374617274222c2066756e6374696f6e2829207b0a0a7d290a0a636f6e736f6c652e6c6f6728224a53204163746976652229', '{"content-type":["application/javascript"],"date":["Tue, 06 Dec 2016 20:24:47 GMT"],"connection":["close"],"transfer-encoding":["chunked"]}', 'https://alastairtest.ngrok.io/reader/client.js', 'https://alastairtest.ngrok.io/reader/sw.js', 200);

insert into "cache" ("cache_id", "contents", "headers", "resource_url", "service_worker_url", "status") values ('reader-1481055887056', X'406368617273657420225554462d38223b0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a205479706f677261706879202a2f0a2f2a20536861646f7773202a2f0a2f2a20416e696d6174696f6e73202a2f0a2f2a204469616c6f67202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a205479706f677261706879202a2f0a2f2a20536861646f7773202a2f0a2f2a20416e696d6174696f6e73202a2f0a2f2a204469616c6f67202a2f0a2e6d646c2d627574746f6e207b0a20206261636b67726f756e643a207472616e73706172656e743b0a2020626f726465723a206e6f6e653b0a2020626f726465722d7261646975733a203270783b0a2020636f6c6f723a2072676228302c302c30293b0a2020706f736974696f6e3a2072656c61746976653b0a20206865696768743a20333670783b0a20206d617267696e3a20303b0a20206d696e2d77696474683a20363470783b0a202070616464696e673a203020313670783b0a2020646973706c61793a20696e6c696e652d626c6f636b3b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a2020746578742d7472616e73666f726d3a207570706572636173653b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b0a20206f766572666c6f773a2068696464656e3b0a202077696c6c2d6368616e67653a20626f782d736861646f773b0a20207472616e736974696f6e3a20626f782d736861646f7720302e32732063756269632d62657a69657228302e342c20302c20312c2031292c206261636b67726f756e642d636f6c6f7220302e32732063756269632d62657a69657228302e342c20302c20302e322c2031292c20636f6c6f7220302e32732063756269632d62657a69657228302e342c20302c20302e322c2031293b0a20206f75746c696e653a206e6f6e653b0a2020637572736f723a20706f696e7465723b0a2020746578742d6465636f726174696f6e3a206e6f6e653b0a2020746578742d616c69676e3a2063656e7465723b0a20206c696e652d6865696768743a20333670783b0a2020766572746963616c2d616c69676e3a206d6964646c653b207d0a20202e6d646c2d627574746f6e3a3a2d6d6f7a2d666f6375732d696e6e6572207b0a20202020626f726465723a20303b207d0a20202e6d646c2d627574746f6e3a686f766572207b0a202020206261636b67726f756e642d636f6c6f723a2072676261283135382c3135382c3135382c20302e3230293b207d0a20202e6d646c2d627574746f6e3a666f6375733a6e6f74283a61637469766529207b0a202020206261636b67726f756e642d636f6c6f723a207267626128302c302c302c20302e3132293b207d0a20202e6d646c2d627574746f6e3a616374697665207b0a202020206261636b67726f756e642d636f6c6f723a2072676261283135382c3135382c3135382c20302e3430293b207d0a20202e6d646c2d627574746f6e2e6d646c2d627574746f6e2d2d636f6c6f726564207b0a20202020636f6c6f723a207267622831332c2039382c20313436293b207d0a202020202e6d646c2d627574746f6e2e6d646c2d627574746f6e2d2d636f6c6f7265643a666f6375733a6e6f74283a61637469766529207b0a2020202020206261636b67726f756e642d636f6c6f723a207267626128302c302c302c20302e3132293b207d0a0a696e7075742e6d646c2d627574746f6e5b747970653d227375626d6974225d207b0a20202d7765626b69742d617070656172616e63653a206e6f6e653b207d0a0a2e6d646c2d627574746f6e2d2d726169736564207b0a20206261636b67726f756e643a2072676261283135382c3135382c3135382c20302e3230293b0a2020626f782d736861646f773a203020327078203270782030207267626128302c20302c20302c20302e3134292c20302033707820317078202d327078207267626128302c20302c20302c20302e32292c203020317078203570782030207267626128302c20302c20302c20302e3132293b207d0a20202e6d646c2d627574746f6e2d2d7261697365643a616374697665207b0a20202020626f782d736861646f773a203020347078203570782030207267626128302c20302c20302c20302e3134292c20302031707820313070782030207267626128302c20302c20302c20302e3132292c20302032707820347078202d317078207267626128302c20302c20302c20302e32293b0a202020206261636b67726f756e642d636f6c6f723a2072676261283135382c3135382c3135382c20302e3430293b207d0a20202e6d646c2d627574746f6e2d2d7261697365643a666f6375733a6e6f74283a61637469766529207b0a20202020626f782d736861646f773a2030203020387078207267626128302c20302c20302c20302e3138292c2030203870782031367078207267626128302c20302c20302c20302e3336293b0a202020206261636b67726f756e642d636f6c6f723a2072676261283135382c3135382c3135382c20302e3430293b207d0a20202e6d646c2d627574746f6e2d2d7261697365642e6d646c2d627574746f6e2d2d636f6c6f726564207b0a202020206261636b67726f756e643a207267622831332c2039382c20313436293b0a20202020636f6c6f723a20726762283235352c3235352c323535293b207d0a202020202e6d646c2d627574746f6e2d2d7261697365642e6d646c2d627574746f6e2d2d636f6c6f7265643a686f766572207b0a2020202020206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b207d0a202020202e6d646c2d627574746f6e2d2d7261697365642e6d646c2d627574746f6e2d2d636f6c6f7265643a616374697665207b0a2020202020206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b207d0a202020202e6d646c2d627574746f6e2d2d7261697365642e6d646c2d627574746f6e2d2d636f6c6f7265643a666f6375733a6e6f74283a61637469766529207b0a2020202020206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b207d0a202020202e6d646c2d627574746f6e2d2d7261697365642e6d646c2d627574746f6e2d2d636f6c6f726564202e6d646c2d726970706c65207b0a2020202020206261636b67726f756e643a20726762283235352c3235352c323535293b207d0a0a2e6d646c2d627574746f6e2d2d666162207b0a2020626f726465722d7261646975733a203530253b0a2020666f6e742d73697a653a20323470783b0a20206865696768743a20353670783b0a20206d617267696e3a206175746f3b0a20206d696e2d77696474683a20353670783b0a202077696474683a20353670783b0a202070616464696e673a20303b0a20206f766572666c6f773a2068696464656e3b0a20206261636b67726f756e643a2072676261283135382c3135382c3135382c20302e3230293b0a2020626f782d736861646f773a20302031707820312e3570782030207267626128302c20302c20302c20302e3132292c203020317078203170782030207267626128302c20302c20302c20302e3234293b0a2020706f736974696f6e3a2072656c61746976653b0a20206c696e652d6865696768743a206e6f726d616c3b207d0a20202e6d646c2d627574746f6e2d2d666162202e6d6174657269616c2d69636f6e73207b0a20202020706f736974696f6e3a206162736f6c7574653b0a20202020746f703a203530253b0a202020206c6566743a203530253b0a202020207472616e73666f726d3a207472616e736c617465282d313270782c202d31327078293b0a202020206c696e652d6865696768743a20323470783b0a2020202077696474683a20323470783b207d0a20202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d6d696e692d666162207b0a202020206865696768743a20343070783b0a202020206d696e2d77696474683a20343070783b0a2020202077696474683a20343070783b207d0a20202e6d646c2d627574746f6e2d2d666162202e6d646c2d627574746f6e5f5f726970706c652d636f6e7461696e6572207b0a20202020626f726465722d7261646975733a203530253b0a202020202d7765626b69742d6d61736b2d696d6167653a202d7765626b69742d72616469616c2d6772616469656e7428636972636c652c2077686974652c20626c61636b293b207d0a20202e6d646c2d627574746f6e2d2d6661623a616374697665207b0a20202020626f782d736861646f773a203020347078203570782030207267626128302c20302c20302c20302e3134292c20302031707820313070782030207267626128302c20302c20302c20302e3132292c20302032707820347078202d317078207267626128302c20302c20302c20302e32293b0a202020206261636b67726f756e642d636f6c6f723a2072676261283135382c3135382c3135382c20302e3430293b207d0a20202e6d646c2d627574746f6e2d2d6661623a666f6375733a6e6f74283a61637469766529207b0a20202020626f782d736861646f773a2030203020387078207267626128302c20302c20302c20302e3138292c2030203870782031367078207267626128302c20302c20302c20302e3336293b0a202020206261636b67726f756e642d636f6c6f723a2072676261283135382c3135382c3135382c20302e3430293b207d0a20202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d636f6c6f726564207b0a202020206261636b67726f756e643a20726762283130362c203139332c20323432293b0a20202020636f6c6f723a20726762283235352c3235352c323535293b207d0a202020202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d636f6c6f7265643a686f766572207b0a2020202020206261636b67726f756e642d636f6c6f723a20726762283130362c203139332c20323432293b207d0a202020202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d636f6c6f7265643a666f6375733a6e6f74283a61637469766529207b0a2020202020206261636b67726f756e642d636f6c6f723a20726762283130362c203139332c20323432293b207d0a202020202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d636f6c6f7265643a616374697665207b0a2020202020206261636b67726f756e642d636f6c6f723a20726762283130362c203139332c20323432293b207d0a202020202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d636f6c6f726564202e6d646c2d726970706c65207b0a2020202020206261636b67726f756e643a20726762283235352c3235352c323535293b207d0a0a2e6d646c2d627574746f6e2d2d69636f6e207b0a2020626f726465722d7261646975733a203530253b0a2020666f6e742d73697a653a20323470783b0a20206865696768743a20333270783b0a20206d617267696e2d6c6566743a20303b0a20206d617267696e2d72696768743a20303b0a20206d696e2d77696474683a20333270783b0a202077696474683a20333270783b0a202070616464696e673a20303b0a20206f766572666c6f773a2068696464656e3b0a2020636f6c6f723a20696e68657269743b0a20206c696e652d6865696768743a206e6f726d616c3b207d0a20202e6d646c2d627574746f6e2d2d69636f6e202e6d6174657269616c2d69636f6e73207b0a20202020706f736974696f6e3a206162736f6c7574653b0a20202020746f703a203530253b0a202020206c6566743a203530253b0a202020207472616e73666f726d3a207472616e736c617465282d313270782c202d31327078293b0a202020206c696e652d6865696768743a20323470783b0a2020202077696474683a20323470783b207d0a20202e6d646c2d627574746f6e2d2d69636f6e2e6d646c2d627574746f6e2d2d6d696e692d69636f6e207b0a202020206865696768743a20323470783b0a202020206d696e2d77696474683a20323470783b0a2020202077696474683a20323470783b207d0a202020202e6d646c2d627574746f6e2d2d69636f6e2e6d646c2d627574746f6e2d2d6d696e692d69636f6e202e6d6174657269616c2d69636f6e73207b0a202020202020746f703a203070783b0a2020202020206c6566743a203070783b207d0a20202e6d646c2d627574746f6e2d2d69636f6e202e6d646c2d627574746f6e5f5f726970706c652d636f6e7461696e6572207b0a20202020626f726465722d7261646975733a203530253b0a202020202d7765626b69742d6d61736b2d696d6167653a202d7765626b69742d72616469616c2d6772616469656e7428636972636c652c2077686974652c20626c61636b293b207d0a0a2e6d646c2d627574746f6e5f5f726970706c652d636f6e7461696e6572207b0a2020646973706c61793a20626c6f636b3b0a20206865696768743a20313030253b0a20206c6566743a203070783b0a2020706f736974696f6e3a206162736f6c7574653b0a2020746f703a203070783b0a202077696474683a20313030253b0a20207a2d696e6465783a20303b0a20206f766572666c6f773a2068696464656e3b207d0a20202e6d646c2d627574746f6e5b64697361626c65645d202e6d646c2d627574746f6e5f5f726970706c652d636f6e7461696e6572202e6d646c2d726970706c652c0a20202e6d646c2d627574746f6e2e6d646c2d627574746f6e2d2d64697361626c6564202e6d646c2d627574746f6e5f5f726970706c652d636f6e7461696e6572202e6d646c2d726970706c65207b0a202020206261636b67726f756e642d636f6c6f723a207472616e73706172656e743b207d0a0a2e6d646c2d627574746f6e2d2d7072696d6172792e6d646c2d627574746f6e2d2d7072696d617279207b0a2020636f6c6f723a207267622831332c2039382c20313436293b207d0a20202e6d646c2d627574746f6e2d2d7072696d6172792e6d646c2d627574746f6e2d2d7072696d617279202e6d646c2d726970706c65207b0a202020206261636b67726f756e643a20726762283235352c3235352c323535293b207d0a20202e6d646c2d627574746f6e2d2d7072696d6172792e6d646c2d627574746f6e2d2d7072696d6172792e6d646c2d627574746f6e2d2d7261697365642c202e6d646c2d627574746f6e2d2d7072696d6172792e6d646c2d627574746f6e2d2d7072696d6172792e6d646c2d627574746f6e2d2d666162207b0a20202020636f6c6f723a20726762283235352c3235352c323535293b0a202020206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b207d0a0a2e6d646c2d627574746f6e2d2d616363656e742e6d646c2d627574746f6e2d2d616363656e74207b0a2020636f6c6f723a20726762283130362c203139332c20323432293b207d0a20202e6d646c2d627574746f6e2d2d616363656e742e6d646c2d627574746f6e2d2d616363656e74202e6d646c2d726970706c65207b0a202020206261636b67726f756e643a20726762283235352c3235352c323535293b207d0a20202e6d646c2d627574746f6e2d2d616363656e742e6d646c2d627574746f6e2d2d616363656e742e6d646c2d627574746f6e2d2d7261697365642c202e6d646c2d627574746f6e2d2d616363656e742e6d646c2d627574746f6e2d2d616363656e742e6d646c2d627574746f6e2d2d666162207b0a20202020636f6c6f723a20726762283235352c3235352c323535293b0a202020206261636b67726f756e642d636f6c6f723a20726762283130362c203139332c20323432293b207d0a0a2e6d646c2d627574746f6e5b64697361626c65645d5b64697361626c65645d2c202e6d646c2d627574746f6e2e6d646c2d627574746f6e2d2d64697361626c65642e6d646c2d627574746f6e2d2d64697361626c6564207b0a2020636f6c6f723a207267626128302c302c302c20302e3236293b0a2020637572736f723a2064656661756c743b0a20206261636b67726f756e642d636f6c6f723a207472616e73706172656e743b207d0a0a2e6d646c2d627574746f6e2d2d6661625b64697361626c65645d5b64697361626c65645d2c202e6d646c2d627574746f6e2d2d6661622e6d646c2d627574746f6e2d2d64697361626c65642e6d646c2d627574746f6e2d2d64697361626c6564207b0a20206261636b67726f756e642d636f6c6f723a207267626128302c302c302c20302e3132293b0a2020636f6c6f723a207267626128302c302c302c20302e3236293b207d0a0a2e6d646c2d627574746f6e2d2d7261697365645b64697361626c65645d5b64697361626c65645d2c202e6d646c2d627574746f6e2d2d7261697365642e6d646c2d627574746f6e2d2d64697361626c65642e6d646c2d627574746f6e2d2d64697361626c6564207b0a20206261636b67726f756e642d636f6c6f723a207267626128302c302c302c20302e3132293b0a2020636f6c6f723a207267626128302c302c302c20302e3236293b0a2020626f782d736861646f773a206e6f6e653b207d0a0a2e6d646c2d627574746f6e2d2d636f6c6f7265645b64697361626c65645d5b64697361626c65645d2c202e6d646c2d627574746f6e2d2d636f6c6f7265642e6d646c2d627574746f6e2d2d64697361626c65642e6d646c2d627574746f6e2d2d64697361626c6564207b0a2020636f6c6f723a207267626128302c302c302c20302e3236293b207d0a0a2e6d646c2d627574746f6e202e6d6174657269616c2d69636f6e73207b0a2020766572746963616c2d616c69676e3a206d6964646c653b207d0a0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2f2a0a202a205768617420666f6c6c6f77732069732074686520726573756c74206f66206d756368207265736561726368206f6e2063726f73732d62726f77736572207374796c696e672e0a202a20437265646974206c65667420696e6c696e6520616e6420626967207468616e6b7320746f204e69636f6c61732047616c6c61676865722c204a6f6e617468616e204e65616c2c0a202a204b726f632043616d656e2c20616e642074686520483542502064657620636f6d6d756e69747920616e64207465616d2e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a20202042617365207374796c65733a206f70696e696f6e617465642064656661756c74730a2020203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d202a2f0a68746d6c207b0a2020636f6c6f723a207267626128302c302c302c20302e3837293b0a2020666f6e742d73697a653a2031656d3b0a20206c696e652d6865696768743a20312e343b207d0a0a2f2a0a202a2052656d6f766520746578742d736861646f7720696e2073656c656374696f6e20686967686c696768743a0a202a2068747470733a2f2f747769747465722e636f6d2f6d696b657461796c722f7374617475732f31323232383830353330310a202a0a202a2054686573652073656c656374696f6e2072756c652073657473206861766520746f2062652073657061726174652e0a202a20437573746f6d697a6520746865206261636b67726f756e6420636f6c6f7220746f206d6174636820796f75722064657369676e2e0a202a2f0a3a3a73656c656374696f6e207b0a20206261636b67726f756e643a20236233643466633b0a2020746578742d736861646f773a206e6f6e653b207d0a0a2f2a0a202a204120626574746572206c6f6f6b696e672064656661756c7420686f72697a6f6e74616c2072756c650a202a2f0a6872207b0a2020646973706c61793a20626c6f636b3b0a20206865696768743a203170783b0a2020626f726465723a20303b0a2020626f726465722d746f703a2031707820736f6c696420236363633b0a20206d617267696e3a2031656d20303b0a202070616464696e673a20303b207d0a0a2f2a0a202a2052656d6f76652074686520676170206265747765656e20617564696f2c2063616e7661732c20696672616d65732c0a202a20696d616765732c20766964656f7320616e642074686520626f74746f6d206f6620746865697220636f6e7461696e6572733a0a202a2068747470733a2f2f6769746875622e636f6d2f683562702f68746d6c352d626f696c6572706c6174652f6973737565732f3434300a202a2f0a617564696f2c0a63616e7661732c0a696672616d652c0a696d672c0a7376672c0a766964656f207b0a2020766572746963616c2d616c69676e3a206d6964646c653b207d0a0a2f2a0a202a2052656d6f76652064656661756c74206669656c64736574207374796c65732e0a202a2f0a6669656c64736574207b0a2020626f726465723a20303b0a20206d617267696e3a20303b0a202070616464696e673a20303b207d0a0a2f2a0a202a20416c6c6f77206f6e6c7920766572746963616c20726573697a696e67206f66207465787461726561732e0a202a2f0a7465787461726561207b0a2020726573697a653a20766572746963616c3b207d0a0a2f2a203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a20202042726f7773657220557067726164652050726f6d70740a2020203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d202a2f0a2e62726f7773657275706772616465207b0a20206d617267696e3a20302e32656d20303b0a20206261636b67726f756e643a20236363633b0a2020636f6c6f723a20233030303b0a202070616464696e673a20302e32656d20303b207d0a0a2f2a203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a202020417574686f72277320637573746f6d207374796c65730a2020203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a20202048656c70657220636c61737365730a2020203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d202a2f0a2f2a0a202a20486964652076697375616c6c7920616e642066726f6d2073637265656e20726561646572733a0a202a2f0a2e68696464656e207b0a2020646973706c61793a206e6f6e652021696d706f7274616e743b207d0a0a2f2a0a202a2048696465206f6e6c792076697375616c6c792c20627574206861766520697420617661696c61626c6520666f722073637265656e20726561646572733a0a202a20687474703a2f2f736e6f6f6b2e63612f61726368697665732f68746d6c5f616e645f6373732f686964696e672d636f6e74656e742d666f722d6163636573736962696c6974790a202a2f0a2e76697375616c6c7968696464656e207b0a2020626f726465723a20303b0a2020636c69703a20726563742830203020302030293b0a20206865696768743a203170783b0a20206d617267696e3a202d3170783b0a20206f766572666c6f773a2068696464656e3b0a202070616464696e673a20303b0a2020706f736974696f6e3a206162736f6c7574653b0a202077696474683a203170783b207d0a0a2f2a0a202a20457874656e647320746865202e76697375616c6c7968696464656e20636c61737320746f20616c6c6f772074686520656c656d656e740a202a20746f20626520666f63757361626c65207768656e206e617669676174656420746f2076696120746865206b6579626f6172643a0a202a2068747470733a2f2f7777772e64727570616c2e6f72672f6e6f64652f3839373633380a202a2f0a2e76697375616c6c7968696464656e2e666f63757361626c653a6163746976652c0a2e76697375616c6c7968696464656e2e666f63757361626c653a666f637573207b0a2020636c69703a206175746f3b0a20206865696768743a206175746f3b0a20206d617267696e3a20303b0a20206f766572666c6f773a2076697369626c653b0a2020706f736974696f6e3a207374617469633b0a202077696474683a206175746f3b207d0a0a2f2a0a202a20486964652076697375616c6c7920616e642066726f6d2073637265656e20726561646572732c20627574206d61696e7461696e206c61796f75740a202a2f0a2e696e76697369626c65207b0a20207669736962696c6974793a2068696464656e3b207d0a0a2f2a0a202a20436c6561726669783a20636f6e7461696e20666c6f6174730a202a0a202a20466f72206d6f6465726e2062726f77736572730a202a20312e2054686520737061636520636f6e74656e74206973206f6e652077617920746f2061766f696420616e204f7065726120627567207768656e207468650a202a2020202060636f6e74656e746564697461626c65602061747472696275746520697320696e636c7564656420616e79776865726520656c736520696e2074686520646f63756d656e742e0a202a202020204f74686572776973652069742063617573657320737061636520746f206170706561722061742074686520746f7020616e6420626f74746f6d206f6620656c656d656e74730a202a20202020746861742072656365697665207468652060636c6561726669786020636c6173732e0a202a20322e2054686520757365206f6620607461626c656020726174686572207468616e2060626c6f636b60206973206f6e6c79206e6563657373617279206966207573696e670a202a20202020603a6265666f72656020746f20636f6e7461696e2074686520746f702d6d617267696e73206f66206368696c6420656c656d656e74732e0a202a2f0a2e636c6561726669783a6265666f72652c0a2e636c6561726669783a6166746572207b0a2020636f6e74656e743a202220223b0a20202f2a2031202a2f0a2020646973706c61793a207461626c653b0a20202f2a2032202a2f207d0a0a2e636c6561726669783a6166746572207b0a2020636c6561723a20626f74683b207d0a0a2f2a203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a2020204558414d504c45204d65646961205175657269657320666f7220526573706f6e736976652044657369676e2e0a2020205468657365206578616d706c6573206f7665727269646520746865207072696d6172792028276d6f62696c652066697273742729207374796c65732e0a2020204d6f6469667920617320636f6e74656e742072657175697265732e0a2020203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d202a2f0a406d65646961206f6e6c792073637265656e20616e6420286d696e2d77696474683a203335656d29207b0a20202f2a205374796c652061646a7573746d656e747320666f722076696577706f7274732074686174206d6565742074686520636f6e646974696f6e202a2f207d0a0a406d65646961207072696e742c20286d696e2d7265736f6c7574696f6e3a20312e323564707078292c20286d696e2d7265736f6c7574696f6e3a2031323064706929207b0a20202f2a205374796c652061646a7573746d656e747320666f722068696768207265736f6c7574696f6e2064657669636573202a2f207d0a0a2f2a203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0a2020205072696e74207374796c65732e0a202020496e6c696e656420746f2061766f696420746865206164646974696f6e616c204854545020726571756573743a0a202020687474703a2f2f7777772e7068706965642e636f6d2f64656c61792d6c6f6164696e672d796f75722d7072696e742d6373732f0a2020203d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d202a2f0a406d65646961207072696e74207b0a20202a2c0a20202a3a6265666f72652c0a20202a3a61667465722c0a20202a3a66697273742d6c6574746572207b0a202020206261636b67726f756e643a207472616e73706172656e742021696d706f7274616e743b0a20202020636f6c6f723a20233030302021696d706f7274616e743b0a202020202f2a20426c61636b207072696e7473206661737465723a20687474703a2f2f7777772e73616e6265696a692e636f6d2f61726368697665732f393533202a2f0a20202020626f782d736861646f773a206e6f6e652021696d706f7274616e743b207d0a2020612c0a2020613a76697369746564207b0a20202020746578742d6465636f726174696f6e3a20756e6465726c696e653b207d0a2020615b687265665d3a6166746572207b0a20202020636f6e74656e743a20222028222061747472286872656629202229223b207d0a2020616262725b7469746c655d3a6166746572207b0a20202020636f6e74656e743a20222028222061747472287469746c6529202229223b207d0a20202f2a0a20202020202a20446f6e27742073686f77206c696e6b7320746861742061726520667261676d656e74206964656e746966696572732c0a20202020202a206f72207573652074686520606a6176617363726970743a602070736575646f2070726f746f636f6c0a20202020202a2f0a2020615b687265665e3d2223225d3a61667465722c0a2020615b687265665e3d226a6176617363726970743a225d3a6166746572207b0a20202020636f6e74656e743a2022223b207d0a20207072652c0a2020626c6f636b71756f7465207b0a20202020626f726465723a2031707820736f6c696420233939393b0a20202020706167652d627265616b2d696e736964653a2061766f69643b207d0a20202f2a0a20202020202a205072696e74696e67205461626c65733a0a20202020202a20687474703a2f2f6373732d646973637573732e696e637574696f2e636f6d2f77696b692f5072696e74696e675f5461626c65730a20202020202a2f0a20207468656164207b0a20202020646973706c61793a207461626c652d6865616465722d67726f75703b207d0a202074722c0a2020696d67207b0a20202020706167652d627265616b2d696e736964653a2061766f69643b207d0a2020696d67207b0a202020206d61782d77696474683a20313030252021696d706f7274616e743b207d0a2020702c0a202068322c0a20206833207b0a202020206f727068616e733a20333b0a202020207769646f77733a20333b207d0a202068322c0a20206833207b0a20202020706167652d627265616b2d61667465723a2061766f69643b207d207d0a0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2052656d6f76652074686520756e77616e74656420626f782061726f756e642046414220627574746f6e73202a2f0a2f2a204d6f726520696e666f3a20687474703a2f2f676f6f2e676c2f4950774b69202a2f0a612c202e6d646c2d6163636f7264696f6e2c202e6d646c2d627574746f6e2c202e6d646c2d636172642c202e6d646c2d636865636b626f782c202e6d646c2d64726f70646f776e2d6d656e752c0a2e6d646c2d69636f6e2d746f67676c652c202e6d646c2d6974656d2c202e6d646c2d726164696f2c202e6d646c2d736c696465722c202e6d646c2d7377697463682c202e6d646c2d746162735f5f746162207b0a20202d7765626b69742d7461702d686967686c696768742d636f6c6f723a207472616e73706172656e743b0a20202d7765626b69742d7461702d686967686c696768742d636f6c6f723a2072676261283235352c203235352c203235352c2030293b207d0a0a2f2a0a202a204d616b652068746d6c2074616b652075702074686520656e746972652073637265656e0a202a205468656e2073657420746f7563682d616374696f6e20746f2061766f696420746f7563682064656c6179206f6e206d6f62696c652049450a202a2f0a68746d6c207b0a202077696474683a20313030253b0a20206865696768743a20313030253b0a20202d6d732d746f7563682d616374696f6e3a206d616e6970756c6174696f6e3b0a2020746f7563682d616374696f6e3a206d616e6970756c6174696f6e3b207d0a0a2f2a0a2a204d616b6520626f64792074616b652075702074686520656e746972652073637265656e0a2a2052656d6f766520626f6479206d617267696e20736f206c61796f757420636f6e7461696e65727320646f6e2774206361757365206578747261206f766572666c6f772e0a2a2f0a626f6479207b0a202077696474683a20313030253b0a20206d696e2d6865696768743a20313030253b0a20206d617267696e3a20303b207d0a0a2f2a0a202a204d61696e20646973706c617920726573657420666f7220494520737570706f72742e0a202a20536f757263653a20687474703a2f2f7765626c6f672e776573742d77696e642e636f6d2f706f7374732f323031352f4a616e2f31322f6d61696e2d48544d4c352d5461672d6e6f742d776f726b696e672d696e2d496e7465726e65742d4578706c6f7265722d39313031310a202a2f0a6d61696e207b0a2020646973706c61793a20626c6f636b3b207d0a0a2f2a0a2a204170706c79206e6f20646973706c617920746f20656c656d656e74732077697468207468652068696464656e206174747269627574652e0a2a204945203920616e6420313020737570706f72742e0a2a2f0a2a5b68696464656e5d207b0a2020646973706c61793a206e6f6e652021696d706f7274616e743b207d0a0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a205479706f677261706879202a2f0a2f2a20536861646f7773202a2f0a2f2a20416e696d6174696f6e73202a2f0a2f2a204469616c6f67202a2f0a68746d6c2c20626f6479207b0a2020666f6e742d66616d696c793a202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323070783b207d0a0a68312c2068322c2068332c2068342c2068352c2068362c2070207b0a20206d617267696e3a20303b0a202070616464696e673a20303b207d0a0a2f2a2a0a20202a205374796c657320666f722048544d4c20656c656d656e74730a20202a2f0a683120736d616c6c2c20683220736d616c6c2c20683320736d616c6c2c20683420736d616c6c2c20683520736d616c6c2c20683620736d616c6c207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20353670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20312e33353b0a20206c65747465722d73706163696e673a202d302e3032656d3b0a20206f7061636974793a20302e35343b0a2020666f6e742d73697a653a20302e36656d3b207d0a0a6831207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20353670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20312e33353b0a20206c65747465722d73706163696e673a202d302e3032656d3b0a20206d617267696e2d746f703a20323470783b0a20206d617267696e2d626f74746f6d3a20323470783b207d0a0a6832207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20343570783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20343870783b0a20206d617267696e2d746f703a20323470783b0a20206d617267696e2d626f74746f6d3a20323470783b207d0a0a6833207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20333470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20343070783b0a20206d617267696e2d746f703a20323470783b0a20206d617267696e2d626f74746f6d3a20323470783b207d0a0a6834207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20333270783b0a20202d6d6f7a2d6f73782d666f6e742d736d6f6f7468696e673a20677261797363616c653b0a20206d617267696e2d746f703a20323470783b0a20206d617267696e2d626f74746f6d3a20313670783b207d0a0a6835207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323070783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20302e3032656d3b0a20206d617267696e2d746f703a20323470783b0a20206d617267696e2d626f74746f6d3a20313670783b207d0a0a6836207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20302e3034656d3b0a20206d617267696e2d746f703a20323470783b0a20206d617267696e2d626f74746f6d3a20313670783b207d0a0a70207b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b0a20206d617267696e2d626f74746f6d3a20313670783b207d0a0a61207b0a2020636f6c6f723a20726762283130362c203139332c20323432293b0a2020666f6e742d7765696768743a203530303b207d0a0a626c6f636b71756f7465207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020706f736974696f6e3a2072656c61746976653b0a2020666f6e742d73697a653a20323470783b0a2020666f6e742d7765696768743a203330303b0a2020666f6e742d7374796c653a206974616c69633b0a20206c696e652d6865696768743a20312e33353b0a20206c65747465722d73706163696e673a20302e3038656d3b207d0a2020626c6f636b71756f74653a6265666f7265207b0a20202020706f736974696f6e3a206162736f6c7574653b0a202020206c6566743a202d302e35656d3b0a20202020636f6e74656e743a2027e2809c273b207d0a2020626c6f636b71756f74653a6166746572207b0a20202020636f6e74656e743a2027e2809d273b0a202020206d617267696e2d6c6566743a202d302e3035656d3b207d0a0a6d61726b207b0a20206261636b67726f756e642d636f6c6f723a20236634666638313b207d0a0a6474207b0a2020666f6e742d7765696768743a203730303b207d0a0a61646472657373207b0a2020666f6e742d73697a653a20313270783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b0a2020666f6e742d7374796c653a206e6f726d616c3b207d0a0a756c2c206f6c207b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b207d0a0a2f2a2a0a202a20436c617373204e616d65205374796c65730a202a2f0a2e6d646c2d7479706f6772617068792d2d646973706c61792d34207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a2031313270783b0a2020666f6e742d7765696768743a203330303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a202d302e3034656d3b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d342d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a2031313270783b0a2020666f6e742d7765696768743a203330303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a202d302e3034656d3b0a20206f7061636974793a20302e35343b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d33207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20353670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20312e33353b0a20206c65747465722d73706163696e673a202d302e3032656d3b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d332d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20353670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20312e33353b0a20206c65747465722d73706163696e673a202d302e3032656d3b0a20206f7061636974793a20302e35343b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d32207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20343570783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20343870783b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d322d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20343570783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20343870783b0a20206f7061636974793a20302e35343b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d31207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20333470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20343070783b207d0a0a2e6d646c2d7479706f6772617068792d2d646973706c61792d312d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20333470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20343070783b0a20206f7061636974793a20302e35343b207d0a0a2e6d646c2d7479706f6772617068792d2d686561646c696e65207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20333270783b0a20202d6d6f7a2d6f73782d666f6e742d736d6f6f7468696e673a20677261797363616c653b207d0a0a2e6d646c2d7479706f6772617068792d2d686561646c696e652d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20333270783b0a20202d6d6f7a2d6f73782d666f6e742d736d6f6f7468696e673a20677261797363616c653b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d7469746c65207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323070783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20302e3032656d3b207d0a0a2e6d646c2d7479706f6772617068792d2d7469746c652d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323070783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20302e3032656d3b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d73756268656164207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20302e3034656d3b207d0a0a2e6d646c2d7479706f6772617068792d2d737562686561642d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313670783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20302e3034656d3b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d32207b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a20626f6c643b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d322d636f6c6f722d636f6e7472617374207b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a20626f6c643b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d31207b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d312d636f6c6f722d636f6e7472617374207b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d322d666f7263652d7072656665727265642d666f6e74207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d322d666f7263652d7072656665727265642d666f6e742d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d312d666f7263652d7072656665727265642d666f6e74207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d626f64792d312d666f7263652d7072656665727265642d666f6e742d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d63617074696f6e207b0a2020666f6e742d73697a653a20313270783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d63617074696f6e2d666f7263652d7072656665727265642d666f6e74207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313270783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d63617074696f6e2d636f6c6f722d636f6e7472617374207b0a2020666f6e742d73697a653a20313270783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e35343b207d0a0a2e6d646c2d7479706f6772617068792d2d63617074696f6e2d666f7263652d7072656665727265642d666f6e742d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313270783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e35343b207d0a0a2e6d646c2d7479706f6772617068792d2d6d656e75207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d6d656e752d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d627574746f6e207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a2020746578742d7472616e73666f726d3a207570706572636173653b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b207d0a0a2e6d646c2d7479706f6772617068792d2d627574746f6e2d636f6c6f722d636f6e7472617374207b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203530303b0a2020746578742d7472616e73666f726d3a207570706572636173653b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d6c656674207b0a2020746578742d616c69676e3a206c6566743b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d7269676874207b0a2020746578742d616c69676e3a2072696768743b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d63656e746572207b0a2020746578742d616c69676e3a2063656e7465723b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d6a757374696679207b0a2020746578742d616c69676e3a206a7573746966793b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d6e6f77726170207b0a202077686974652d73706163653a206e6f777261703b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d6c6f77657263617365207b0a2020746578742d7472616e73666f726d3a206c6f776572636173653b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d757070657263617365207b0a2020746578742d7472616e73666f726d3a207570706572636173653b207d0a0a2e6d646c2d7479706f6772617068792d2d746578742d6361706974616c697a65207b0a2020746578742d7472616e73666f726d3a206361706974616c697a653b207d0a0a2e6d646c2d7479706f6772617068792d2d666f6e742d7468696e207b0a2020666f6e742d7765696768743a203230302021696d706f7274616e743b207d0a0a2e6d646c2d7479706f6772617068792d2d666f6e742d6c69676874207b0a2020666f6e742d7765696768743a203330302021696d706f7274616e743b207d0a0a2e6d646c2d7479706f6772617068792d2d666f6e742d726567756c6172207b0a2020666f6e742d7765696768743a203430302021696d706f7274616e743b207d0a0a2e6d646c2d7479706f6772617068792d2d666f6e742d6d656469756d207b0a2020666f6e742d7765696768743a203530302021696d706f7274616e743b207d0a0a2e6d646c2d7479706f6772617068792d2d666f6e742d626f6c64207b0a2020666f6e742d7765696768743a203730302021696d706f7274616e743b207d0a0a2e6d646c2d7479706f6772617068792d2d666f6e742d626c61636b207b0a2020666f6e742d7765696768743a203930302021696d706f7274616e743b207d0a0a2e6d6174657269616c2d69636f6e73207b0a2020666f6e742d66616d696c793a20274d6174657269616c2049636f6e73273b0a2020666f6e742d7765696768743a206e6f726d616c3b0a2020666f6e742d7374796c653a206e6f726d616c3b0a2020666f6e742d73697a653a20323470783b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a206e6f726d616c3b0a2020746578742d7472616e73666f726d3a206e6f6e653b0a2020646973706c61793a20696e6c696e652d626c6f636b3b0a2020776f72642d777261703a206e6f726d616c3b0a2020666f6e742d666561747572652d73657474696e67733a20276c696761273b0a20202d7765626b69742d666f6e742d666561747572652d73657474696e67733a20276c696761273b0a20202d7765626b69742d666f6e742d736d6f6f7468696e673a20616e7469616c69617365643b207d0a0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a205479706f677261706879202a2f0a2f2a20536861646f7773202a2f0a2f2a20416e696d6174696f6e73202a2f0a2f2a204469616c6f67202a2f0a2e6d646c2d6e617669676174696f6e207b0a2020646973706c61793a20666c65783b0a2020666c65782d777261703a206e6f777261703b0a2020626f782d73697a696e673a20626f726465722d626f783b207d0a0a2e6d646c2d6e617669676174696f6e5f5f6c696e6b207b0a2020636f6c6f723a207267622836362c36362c3636293b0a2020746578742d6465636f726174696f6e3a206e6f6e653b0a20206d617267696e3a20303b0a2020666f6e742d73697a653a20313470783b0a2020666f6e742d7765696768743a203430303b0a20206c696e652d6865696768743a20323470783b0a20206c65747465722d73706163696e673a20303b0a20206f7061636974793a20302e38373b207d0a20202e6d646c2d6e617669676174696f6e5f5f6c696e6b202e6d6174657269616c2d69636f6e73207b0a20202020766572746963616c2d616c69676e3a206d6964646c653b207d0a0a2e6d646c2d6c61796f7574207b0a202077696474683a20313030253b0a20206865696768743a20313030253b0a2020646973706c61793a20666c65783b0a2020666c65782d646972656374696f6e3a20636f6c756d6e3b0a20206f766572666c6f772d793a206175746f3b0a20206f766572666c6f772d783a2068696464656e3b0a2020706f736974696f6e3a2072656c61746976653b0a20202d7765626b69742d6f766572666c6f772d7363726f6c6c696e673a20746f7563683b207d0a0a2e6d646c2d6c61796f75742e69732d736d616c6c2d73637265656e202e6d646c2d6c61796f75742d2d6c617267652d73637265656e2d6f6e6c79207b0a2020646973706c61793a206e6f6e653b207d0a0a2e6d646c2d6c61796f75743a6e6f74282e69732d736d616c6c2d73637265656e29202e6d646c2d6c61796f75742d2d736d616c6c2d73637265656e2d6f6e6c79207b0a2020646973706c61793a206e6f6e653b207d0a0a2e6d646c2d6c61796f75745f5f636f6e7461696e6572207b0a2020706f736974696f6e3a206162736f6c7574653b0a202077696474683a20313030253b0a20206865696768743a20313030253b207d0a0a2e6d646c2d6c61796f75745f5f7469746c652c0a2e6d646c2d6c61796f75742d7469746c65207b0a2020646973706c61793a20626c6f636b3b0a2020706f736974696f6e3a2072656c61746976653b0a2020666f6e742d66616d696c793a2022526f626f746f222c202248656c766574696361222c2022417269616c222c2073616e732d73657269663b0a2020666f6e742d73697a653a20323070783b0a2020666f6e742d7765696768743a203530303b0a20206c696e652d6865696768743a20313b0a20206c65747465722d73706163696e673a20302e3032656d3b0a2020666f6e742d7765696768743a203430303b0a2020626f782d73697a696e673a20626f726465722d626f783b207d0a0a2e6d646c2d6c61796f75742d737061636572207b0a2020666c65782d67726f773a20313b207d0a0a2e6d646c2d6c61796f75745f5f647261776572207b0a2020646973706c61793a20666c65783b0a2020666c65782d646972656374696f6e3a20636f6c756d6e3b0a2020666c65782d777261703a206e6f777261703b0a202077696474683a2032343070783b0a20206865696768743a20313030253b0a20206d61782d6865696768743a20313030253b0a2020706f736974696f6e3a206162736f6c7574653b0a2020746f703a20303b0a20206c6566743a20303b0a2020626f782d736861646f773a203020327078203270782030207267626128302c20302c20302c20302e3134292c20302033707820317078202d327078207267626128302c20302c20302c20302e32292c203020317078203570782030207267626128302c20302c20302c20302e3132293b0a2020626f782d73697a696e673a20626f726465722d626f783b0a2020626f726465722d72696768743a2031707820736f6c696420726762283232342c3232342c323234293b0a20206261636b67726f756e643a20726762283235302c3235302c323530293b0a20207472616e73666f726d3a207472616e736c61746558282d3235307078293b0a20207472616e73666f726d2d7374796c653a2070726573657276652d33643b0a202077696c6c2d6368616e67653a207472616e73666f726d3b0a20207472616e736974696f6e2d6475726174696f6e3a20302e32733b0a20207472616e736974696f6e2d74696d696e672d66756e6374696f6e3a2063756269632d62657a69657228302e342c20302c20302e322c2031293b0a20207472616e736974696f6e2d70726f70657274793a207472616e73666f726d3b0a2020636f6c6f723a207267622836362c36362c3636293b0a20206f766572666c6f773a2076697369626c653b0a20206f766572666c6f772d793a206175746f3b0a20207a2d696e6465783a20353b207d0a20202e6d646c2d6c61796f75745f5f6472617765722e69732d76697369626c65207b0a202020207472616e73666f726d3a207472616e736c617465582830293b207d0a202020202e6d646c2d6c61796f75745f5f6472617765722e69732d76697369626c65207e202e6d646c2d6c61796f75745f5f636f6e74656e742e6d646c2d6c61796f75745f5f636f6e74656e74207b0a2020202020206f766572666c6f773a2068696464656e3b207d0a20202e6d646c2d6c61796f75745f5f647261776572203e202a207b0a20202020666c65782d736872696e6b3a20303b207d0a20202e6d646c2d6c61796f75745f5f647261776572203e202e6d646c2d6c61796f75745f5f7469746c652c0a20202e6d646c2d6c61796f75745f5f647261776572203e202e6d646c2d6c61796f75742d7469746c65207b0a202020206c696e652d6865696768743a20363470783b0a2020202070616464696e672d6c6566743a20343070783b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f647261776572203e202e6d646c2d6c61796f75745f5f7469746c652c0a2020202020202e6d646c2d6c61796f75745f5f647261776572203e202e6d646c2d6c61796f75742d7469746c65207b0a20202020202020206c696e652d6865696768743a20353670783b0a202020202020202070616464696e672d6c6566743a20313670783b207d207d0a20202e6d646c2d6c61796f75745f5f647261776572202e6d646c2d6e617669676174696f6e207b0a20202020666c65782d646972656374696f6e3a20636f6c756d6e3b0a20202020616c69676e2d6974656d733a20737472657463683b0a2020202070616464696e672d746f703a20313670783b207d0a202020202e6d646c2d6c61796f75745f5f647261776572202e6d646c2d6e617669676174696f6e202e6d646c2d6e617669676174696f6e5f5f6c696e6b207b0a202020202020646973706c61793a20626c6f636b3b0a202020202020666c65782d736872696e6b3a20303b0a20202020202070616464696e673a203136707820343070783b0a2020202020206d617267696e3a20303b0a202020202020636f6c6f723a20233735373537353b207d0a202020202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a20202020202020202e6d646c2d6c61796f75745f5f647261776572202e6d646c2d6e617669676174696f6e202e6d646c2d6e617669676174696f6e5f5f6c696e6b207b0a2020202020202020202070616464696e673a203136707820313670783b207d207d0a2020202020202e6d646c2d6c61796f75745f5f647261776572202e6d646c2d6e617669676174696f6e202e6d646c2d6e617669676174696f6e5f5f6c696e6b3a686f766572207b0a20202020202020206261636b67726f756e642d636f6c6f723a20726762283232342c3232342c323234293b207d0a2020202020202e6d646c2d6c61796f75745f5f647261776572202e6d646c2d6e617669676174696f6e202e6d646c2d6e617669676174696f6e5f5f6c696e6b2d2d63757272656e74207b0a20202020202020206261636b67726f756e642d636f6c6f723a20726762283232342c3232342c323234293b0a2020202020202020636f6c6f723a2072676228302c302c30293b207d0a2020406d656469612073637265656e20616e6420286d696e2d77696474683a2031303235707829207b0a202020202e6d646c2d6c61796f75742d2d66697865642d647261776572203e202e6d646c2d6c61796f75745f5f647261776572207b0a2020202020207472616e73666f726d3a207472616e736c617465582830293b207d207d0a0a2e6d646c2d6c61796f75745f5f6472617765722d627574746f6e207b0a2020646973706c61793a20626c6f636b3b0a2020706f736974696f6e3a206162736f6c7574653b0a20206865696768743a20343870783b0a202077696474683a20343870783b0a2020626f726465723a20303b0a2020666c65782d736872696e6b3a20303b0a20206f766572666c6f773a2068696464656e3b0a2020746578742d616c69676e3a2063656e7465723b0a2020637572736f723a20706f696e7465723b0a2020666f6e742d73697a653a20323670783b0a20206c696e652d6865696768743a20353670783b0a2020666f6e742d66616d696c793a2048656c7665746963612c20417269616c2c2073616e732d73657269663b0a20206d617267696e3a2038707820313270783b0a2020746f703a20303b0a20206c6566743a20303b0a2020636f6c6f723a20726762283235352c3235352c323535293b0a20207a2d696e6465783a20343b207d0a20202e6d646c2d6c61796f75745f5f686561646572202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e207b0a20202020706f736974696f6e3a206162736f6c7574653b0a20202020636f6c6f723a20726762283235352c3235352c323535293b0a202020206261636b67726f756e642d636f6c6f723a20696e68657269743b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f686561646572202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e207b0a20202020202020206d617267696e3a203470783b207d207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e207b0a2020202020206d617267696e3a203470783b0a202020202020636f6c6f723a207267626128302c20302c20302c20302e35293b207d207d0a2020406d656469612073637265656e20616e6420286d696e2d77696474683a2031303235707829207b0a202020202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e207b0a2020202020206c696e652d6865696768743a20353470783b207d0a2020202020202e6d646c2d6c61796f75742d2d6e6f2d6465736b746f702d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e2c0a2020202020202e6d646c2d6c61796f75742d2d66697865642d647261776572203e202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e2c0a2020202020202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f6472617765722d627574746f6e207b0a2020202020202020646973706c61793a206e6f6e653b207d207d0a0a2e6d646c2d6c61796f75745f5f686561646572207b0a2020646973706c61793a20666c65783b0a2020666c65782d646972656374696f6e3a20636f6c756d6e3b0a2020666c65782d777261703a206e6f777261703b0a20206a7573746966792d636f6e74656e743a20666c65782d73746172743b0a2020626f782d73697a696e673a20626f726465722d626f783b0a2020666c65782d736872696e6b3a20303b0a202077696474683a20313030253b0a20206d617267696e3a20303b0a202070616464696e673a20303b0a2020626f726465723a206e6f6e653b0a20206d696e2d6865696768743a20363470783b0a20206d61782d6865696768743a203130303070783b0a20207a2d696e6465783a20333b0a20206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b0a2020636f6c6f723a20726762283235352c3235352c323535293b0a2020626f782d736861646f773a203020327078203270782030207267626128302c20302c20302c20302e3134292c20302033707820317078202d327078207267626128302c20302c20302c20302e32292c203020317078203570782030207267626128302c20302c20302c20302e3132293b0a20207472616e736974696f6e2d6475726174696f6e3a20302e32733b0a20207472616e736974696f6e2d74696d696e672d66756e6374696f6e3a2063756269632d62657a69657228302e342c20302c20302e322c2031293b0a20207472616e736974696f6e2d70726f70657274793a206d61782d6865696768742c20626f782d736861646f773b207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f686561646572207b0a2020202020206d696e2d6865696768743a20353670783b207d207d0a20202e6d646c2d6c61796f75742d2d66697865642d6472617765722e69732d75706772616465643a6e6f74282e69732d736d616c6c2d73637265656e29203e202e6d646c2d6c61796f75745f5f686561646572207b0a202020206d617267696e2d6c6566743a2032343070783b0a2020202077696474683a2063616c632831303025202d203234307078293b207d0a2020406d656469612073637265656e20616e6420286d696e2d77696474683a2031303235707829207b0a202020202e6d646c2d6c61796f75742d2d66697865642d647261776572203e202e6d646c2d6c61796f75745f5f686561646572202e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a20202020202070616464696e672d6c6566743a20343070783b207d207d0a20202e6d646c2d6c61796f75745f5f686561646572203e202e6d646c2d6c61796f75742d69636f6e207b0a20202020706f736974696f6e3a206162736f6c7574653b0a202020206c6566743a20343070783b0a20202020746f703a20313670783b0a202020206865696768743a20333270783b0a2020202077696474683a20333270783b0a202020206f766572666c6f773a2068696464656e3b0a202020207a2d696e6465783a20333b0a20202020646973706c61793a20626c6f636b3b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f686561646572203e202e6d646c2d6c61796f75742d69636f6e207b0a20202020202020206c6566743a20313670783b0a2020202020202020746f703a20313270783b207d207d0a20202e6d646c2d6c61796f75742e6861732d647261776572202e6d646c2d6c61796f75745f5f686561646572203e202e6d646c2d6c61796f75742d69636f6e207b0a20202020646973706c61793a206e6f6e653b207d0a20202e6d646c2d6c61796f75745f5f6865616465722e69732d636f6d70616374207b0a202020206d61782d6865696768743a20363470783b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f6865616465722e69732d636f6d70616374207b0a20202020202020206d61782d6865696768743a20353670783b207d207d0a20202e6d646c2d6c61796f75745f5f6865616465722e69732d636f6d706163742e6861732d74616273207b0a202020206865696768743a2031313270783b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f6865616465722e69732d636f6d706163742e6861732d74616273207b0a20202020202020206d696e2d6865696768743a2031303470783b207d207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f686561646572207b0a202020202020646973706c61793a206e6f6e653b207d0a202020202e6d646c2d6c61796f75742d2d66697865642d686561646572203e202e6d646c2d6c61796f75745f5f686561646572207b0a202020202020646973706c61793a20666c65783b207d207d0a0a2e6d646c2d6c61796f75745f5f6865616465722d2d7472616e73706172656e742e6d646c2d6c61796f75745f5f6865616465722d2d7472616e73706172656e74207b0a20206261636b67726f756e642d636f6c6f723a207472616e73706172656e743b0a2020626f782d736861646f773a206e6f6e653b207d0a0a2e6d646c2d6c61796f75745f5f6865616465722d2d7365616d6564207b0a2020626f782d736861646f773a206e6f6e653b207d0a0a2e6d646c2d6c61796f75745f5f6865616465722d2d7363726f6c6c207b0a2020626f782d736861646f773a206e6f6e653b207d0a0a2e6d646c2d6c61796f75745f5f6865616465722d2d776174657266616c6c207b0a2020626f782d736861646f773a206e6f6e653b0a20206f766572666c6f773a2068696464656e3b207d0a20202e6d646c2d6c61796f75745f5f6865616465722d2d776174657266616c6c2e69732d63617374696e672d736861646f77207b0a20202020626f782d736861646f773a203020327078203270782030207267626128302c20302c20302c20302e3134292c20302033707820317078202d327078207267626128302c20302c20302c20302e32292c203020317078203570782030207267626128302c20302c20302c20302e3132293b207d0a20202e6d646c2d6c61796f75745f5f6865616465722d2d776174657266616c6c2e6d646c2d6c61796f75745f5f6865616465722d2d776174657266616c6c2d686964652d746f70207b0a202020206a7573746966792d636f6e74656e743a20666c65782d656e643b207d0a0a2e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a2020646973706c61793a20666c65783b0a2020666c65782d646972656374696f6e3a20726f773b0a2020666c65782d777261703a206e6f777261703b0a2020666c65782d736872696e6b3a20303b0a2020626f782d73697a696e673a20626f726465722d626f783b0a2020616c69676e2d73656c663a20737472657463683b0a2020616c69676e2d6974656d733a2063656e7465723b0a20206865696768743a20363470783b0a20206d617267696e3a20303b0a202070616464696e673a20302034307078203020383070783b207d0a20202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a2020202070616464696e672d6c6566743a20343070783b207d0a2020406d656469612073637265656e20616e6420286d696e2d77696474683a2031303235707829207b0a202020202e6d646c2d6c61796f75742d2d6e6f2d6465736b746f702d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a20202020202070616464696e672d6c6566743a20343070783b207d207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a2020202020206865696768743a20353670783b0a20202020202070616464696e673a20302031367078203020373270783b207d0a2020202020202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a202020202020202070616464696e672d6c6566743a20313670783b207d207d0a20202e6d646c2d6c61796f75745f5f6865616465722d726f77203e202a207b0a20202020666c65782d736872696e6b3a20303b207d0a20202e6d646c2d6c61796f75745f5f6865616465722d2d7363726f6c6c202e6d646c2d6c61796f75745f5f6865616465722d726f77207b0a2020202077696474683a20313030253b207d0a20202e6d646c2d6c61796f75745f5f6865616465722d726f77202e6d646c2d6e617669676174696f6e207b0a202020206d617267696e3a20303b0a2020202070616464696e673a20303b0a202020206865696768743a20363470783b0a20202020666c65782d646972656374696f6e3a20726f773b0a20202020616c69676e2d6974656d733a2063656e7465723b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f6865616465722d726f77202e6d646c2d6e617669676174696f6e207b0a20202020202020206865696768743a20353670783b207d207d0a20202e6d646c2d6c61796f75745f5f6865616465722d726f77202e6d646c2d6e617669676174696f6e5f5f6c696e6b207b0a20202020646973706c61793a20626c6f636b3b0a20202020636f6c6f723a20726762283235352c3235352c323535293b0a202020206c696e652d6865696768743a20363470783b0a2020202070616464696e673a203020323470783b207d0a20202020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a2020202020202e6d646c2d6c61796f75745f5f6865616465722d726f77202e6d646c2d6e617669676174696f6e5f5f6c696e6b207b0a20202020202020206c696e652d6865696768743a20353670783b0a202020202020202070616464696e673a203020313670783b207d207d0a0a2e6d646c2d6c61796f75745f5f6f626675736361746f72207b0a20206261636b67726f756e642d636f6c6f723a207472616e73706172656e743b0a2020706f736974696f6e3a206162736f6c7574653b0a2020746f703a20303b0a20206c6566743a20303b0a20206865696768743a20313030253b0a202077696474683a20313030253b0a20207a2d696e6465783a20343b0a20207669736962696c6974793a2068696464656e3b0a20207472616e736974696f6e2d70726f70657274793a206261636b67726f756e642d636f6c6f723b0a20207472616e736974696f6e2d6475726174696f6e3a20302e32733b0a20207472616e736974696f6e2d74696d696e672d66756e6374696f6e3a2063756269632d62657a69657228302e342c20302c20302e322c2031293b207d0a20202e6d646c2d6c61796f75745f5f6f626675736361746f722e69732d76697369626c65207b0a202020206261636b67726f756e642d636f6c6f723a207267626128302c20302c20302c20302e35293b0a202020207669736962696c6974793a2076697369626c653b207d0a202040737570706f7274732028706f696e7465722d6576656e74733a206175746f29207b0a202020202e6d646c2d6c61796f75745f5f6f626675736361746f72207b0a2020202020206261636b67726f756e642d636f6c6f723a207267626128302c20302c20302c20302e35293b0a2020202020206f7061636974793a20303b0a2020202020207472616e736974696f6e2d70726f70657274793a206f7061636974793b0a2020202020207669736962696c6974793a2076697369626c653b0a202020202020706f696e7465722d6576656e74733a206e6f6e653b207d0a2020202020202e6d646c2d6c61796f75745f5f6f626675736361746f722e69732d76697369626c65207b0a2020202020202020706f696e7465722d6576656e74733a206175746f3b0a20202020202020206f7061636974793a20313b207d207d0a0a2e6d646c2d6c61796f75745f5f636f6e74656e74207b0a20202d6d732d666c65783a20302031206175746f3b0a2020706f736974696f6e3a2072656c61746976653b0a2020646973706c61793a20696e6c696e652d626c6f636b3b0a20206f766572666c6f772d793a206175746f3b0a20206f766572666c6f772d783a2068696464656e3b0a2020666c65782d67726f773a20313b0a20207a2d696e6465783a20313b0a20202d7765626b69742d6f766572666c6f772d7363726f6c6c696e673a20746f7563683b207d0a20202e6d646c2d6c61796f75742d2d66697865642d647261776572203e202e6d646c2d6c61796f75745f5f636f6e74656e74207b0a202020206d617267696e2d6c6566743a2032343070783b207d0a20202e6d646c2d6c61796f75745f5f636f6e7461696e65722e6861732d7363726f6c6c696e672d686561646572202e6d646c2d6c61796f75745f5f636f6e74656e74207b0a202020206f766572666c6f773a2076697369626c653b207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75742d2d66697865642d647261776572203e202e6d646c2d6c61796f75745f5f636f6e74656e74207b0a2020202020206d617267696e2d6c6566743a20303b207d0a202020202e6d646c2d6c61796f75745f5f636f6e7461696e65722e6861732d7363726f6c6c696e672d686561646572202e6d646c2d6c61796f75745f5f636f6e74656e74207b0a2020202020206f766572666c6f772d793a206175746f3b0a2020202020206f766572666c6f772d783a2068696464656e3b207d207d0a0a2e6d646c2d6c61796f75745f5f7461622d626172207b0a20206865696768743a20393670783b0a20206d617267696e3a20303b0a202077696474683a2063616c632831303025202d203131327078293b0a202070616464696e673a20302030203020353670783b0a2020646973706c61793a20666c65783b0a20206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b0a20206f766572666c6f772d793a2068696464656e3b0a20206f766572666c6f772d783a207363726f6c6c3b207d0a20202e6d646c2d6c61796f75745f5f7461622d6261723a3a2d7765626b69742d7363726f6c6c626172207b0a20202020646973706c61793a206e6f6e653b207d0a20202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d626172207b0a2020202070616464696e672d6c6566743a20313670783b0a2020202077696474683a2063616c632831303025202d2033327078293b207d0a2020406d656469612073637265656e20616e6420286d696e2d77696474683a2031303235707829207b0a202020202e6d646c2d6c61796f75742d2d6e6f2d6465736b746f702d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d626172207b0a20202020202070616464696e672d6c6566743a20313670783b0a20202020202077696474683a2063616c632831303025202d2033327078293b207d207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f7461622d626172207b0a20202020202077696474683a2063616c632831303025202d2036307078293b0a20202020202070616464696e673a20302030203020363070783b207d0a2020202020202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d626172207b0a202020202020202077696474683a2063616c632831303025202d20387078293b0a202020202020202070616464696e672d6c6566743a203470783b207d207d0a20202e6d646c2d6c61796f75742d2d66697865642d74616273202e6d646c2d6c61796f75745f5f7461622d626172207b0a2020202070616464696e673a20303b0a202020206f766572666c6f773a2068696464656e3b0a2020202077696474683a20313030253b207d0a0a2e6d646c2d6c61796f75745f5f7461622d6261722d636f6e7461696e6572207b0a2020706f736974696f6e3a2072656c61746976653b0a20206865696768743a20343870783b0a202077696474683a20313030253b0a2020626f726465723a206e6f6e653b0a20206d617267696e3a20303b0a20207a2d696e6465783a20323b0a2020666c65782d67726f773a20303b0a2020666c65782d736872696e6b3a20303b0a20206f766572666c6f773a2068696464656e3b207d0a20202e6d646c2d6c61796f75745f5f636f6e7461696e6572203e202e6d646c2d6c61796f75745f5f7461622d6261722d636f6e7461696e6572207b0a20202020706f736974696f6e3a206162736f6c7574653b0a20202020746f703a20303b0a202020206c6566743a20303b207d0a0a2e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e207b0a2020646973706c61793a20696e6c696e652d626c6f636b3b0a2020706f736974696f6e3a206162736f6c7574653b0a2020746f703a20303b0a20206865696768743a20343870783b0a202077696474683a20353670783b0a20207a2d696e6465783a20343b0a2020746578742d616c69676e3a2063656e7465723b0a20206261636b67726f756e642d636f6c6f723a207267622831332c2039382c20313436293b0a2020636f6c6f723a207472616e73706172656e743b0a2020637572736f723a20706f696e7465723b0a2020757365722d73656c6563743a206e6f6e653b207d0a20202e6d646c2d6c61796f75742d2d6e6f2d6465736b746f702d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e2c0a20202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e207b0a2020202077696474683a20313670783b207d0a202020202e6d646c2d6c61796f75742d2d6e6f2d6465736b746f702d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e202e6d6174657269616c2d69636f6e732c0a202020202e6d646c2d6c61796f75742d2d6e6f2d6472617765722d627574746f6e202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e202e6d6174657269616c2d69636f6e73207b0a202020202020706f736974696f6e3a2072656c61746976653b0a2020202020206c6566743a202d3470783b207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e207b0a20202020202077696474683a20363070783b207d207d0a20202e6d646c2d6c61796f75742d2d66697865642d74616273202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e207b0a20202020646973706c61793a206e6f6e653b207d0a20202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e202e6d6174657269616c2d69636f6e73207b0a202020206c696e652d6865696768743a20343870783b207d0a20202e6d646c2d6c61796f75745f5f7461622d6261722d627574746f6e2e69732d616374697665207b0a20202020636f6c6f723a20726762283235352c3235352c323535293b207d0a0a2e6d646c2d6c61796f75745f5f7461622d6261722d6c6566742d627574746f6e207b0a20206c6566743a20303b207d0a0a2e6d646c2d6c61796f75745f5f7461622d6261722d72696768742d627574746f6e207b0a202072696768743a20303b207d0a0a2e6d646c2d6c61796f75745f5f746162207b0a20206d617267696e3a20303b0a2020626f726465723a206e6f6e653b0a202070616464696e673a20302032347078203020323470783b0a2020666c6f61743a206c6566743b0a2020706f736974696f6e3a2072656c61746976653b0a2020646973706c61793a20626c6f636b3b0a2020666c65782d67726f773a20303b0a2020666c65782d736872696e6b3a20303b0a2020746578742d6465636f726174696f6e3a206e6f6e653b0a20206865696768743a20343870783b0a20206c696e652d6865696768743a20343870783b0a2020746578742d616c69676e3a2063656e7465723b0a2020666f6e742d7765696768743a203530303b0a2020666f6e742d73697a653a20313470783b0a2020746578742d7472616e73666f726d3a207570706572636173653b0a2020636f6c6f723a2072676261283235352c3235352c3235352c20302e36293b0a20206f766572666c6f773a2068696464656e3b207d0a2020406d656469612073637265656e20616e6420286d61782d77696474683a2031303234707829207b0a202020202e6d646c2d6c61796f75745f5f746162207b0a20202020202070616464696e673a20302031327078203020313270783b207d207d0a20202e6d646c2d6c61796f75742d2d66697865642d74616273202e6d646c2d6c61796f75745f5f746162207b0a20202020666c6f61743a206e6f6e653b0a20202020666c65782d67726f773a20313b0a2020202070616464696e673a20303b207d0a20202e6d646c2d6c61796f75742e69732d7570677261646564202e6d646c2d6c61796f75745f5f7461622e69732d616374697665207b0a20202020636f6c6f723a20726762283235352c3235352c323535293b207d0a20202e6d646c2d6c61796f75742e69732d7570677261646564202e6d646c2d6c61796f75745f5f7461622e69732d6163746976653a3a6166746572207b0a202020206865696768743a203270783b0a2020202077696474683a20313030253b0a20202020646973706c61793a20626c6f636b3b0a20202020636f6e74656e743a202220223b0a20202020626f74746f6d3a20303b0a202020206c6566743a20303b0a20202020706f736974696f6e3a206162736f6c7574653b0a202020206261636b67726f756e643a20726762283130362c203139332c20323432293b0a20202020616e696d6174696f6e3a20626f726465722d657870616e6420302e32732063756269632d62657a69657228302e342c20302c20302e342c20312920302e30317320616c7465726e61746520666f7277617264733b0a202020207472616e736974696f6e3a20616c6c2031732063756269632d62657a69657228302e342c20302c20312c2031293b207d0a20202e6d646c2d6c61796f75745f5f746162202e6d646c2d6c61796f75745f5f7461622d726970706c652d636f6e7461696e6572207b0a20202020646973706c61793a20626c6f636b3b0a20202020706f736974696f6e3a206162736f6c7574653b0a202020206865696768743a20313030253b0a2020202077696474683a20313030253b0a202020206c6566743a20303b0a20202020746f703a20303b0a202020207a2d696e6465783a20313b0a202020206f766572666c6f773a2068696464656e3b207d0a202020202e6d646c2d6c61796f75745f5f746162202e6d646c2d6c61796f75745f5f7461622d726970706c652d636f6e7461696e6572202e6d646c2d726970706c65207b0a2020202020206261636b67726f756e642d636f6c6f723a20726762283235352c3235352c323535293b207d0a0a2e6d646c2d6c61796f75745f5f7461622d70616e656c207b0a2020646973706c61793a20626c6f636b3b207d0a20202e6d646c2d6c61796f75742e69732d7570677261646564202e6d646c2d6c61796f75745f5f7461622d70616e656c207b0a20202020646973706c61793a206e6f6e653b207d0a20202e6d646c2d6c61796f75742e69732d7570677261646564202e6d646c2d6c61796f75745f5f7461622d70616e656c2e69732d616374697665207b0a20202020646973706c61793a20626c6f636b3b207d0a0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2e6d646c2d63617264207b0a2020646973706c61793a20666c65783b0a2020666c65782d646972656374696f6e3a20636f6c756d6e3b0a2020666f6e742d73697a653a20313670783b0a2020666f6e742d7765696768743a203430303b0a20206d696e2d6865696768743a2032303070783b0a20206f766572666c6f773a2068696464656e3b0a202077696474683a2033333070783b0a20207a2d696e6465783a20313b0a2020706f736974696f6e3a2072656c61746976653b0a20206261636b67726f756e643a20726762283235352c3235352c323535293b0a2020626f726465722d7261646975733a203270783b0a2020626f782d73697a696e673a20626f726465722d626f783b207d0a0a2e6d646c2d636172645f5f6d65646961207b0a20206261636b67726f756e642d636f6c6f723a20726762283130362c203139332c20323432293b0a20206261636b67726f756e642d7265706561743a207265706561743b0a20206261636b67726f756e642d706f736974696f6e3a20353025203530253b0a20206261636b67726f756e642d73697a653a20636f7665723b0a20206261636b67726f756e642d6f726967696e3a2070616464696e672d626f783b0a20206261636b67726f756e642d6174746163686d656e743a207363726f6c6c3b0a2020626f782d73697a696e673a20626f726465722d626f783b207d0a0a2e6d646c2d636172645f5f7469746c65207b0a2020616c69676e2d6974656d733a2063656e7465723b0a2020636f6c6f723a2072676228302c302c30293b0a2020646973706c61793a20626c6f636b3b0a2020646973706c61793a20666c65783b0a20206a7573746966792d636f6e74656e743a20737472657463683b0a20206c696e652d6865696768743a206e6f726d616c3b0a202070616464696e673a203136707820313670783b0a202070657273706563746976652d6f726967696e3a20313635707820353670783b0a20207472616e73666f726d2d6f726967696e3a20313635707820353670783b0a2020626f782d73697a696e673a20626f726465722d626f783b207d0a20202e6d646c2d636172645f5f7469746c652e6d646c2d636172642d2d626f72646572207b0a20202020626f726465722d626f74746f6d3a2031707820736f6c6964207267626128302c20302c20302c20302e31293b207d0a0a2e6d646c2d636172645f5f7469746c652d74657874207b0a2020616c69676e2d73656c663a20666c65782d656e643b0a2020636f6c6f723a20696e68657269743b0a2020646973706c61793a20626c6f636b3b0a2020646973706c61793a20666c65783b0a2020666f6e742d73697a653a20323470783b0a2020666f6e742d7765696768743a203330303b0a20206c696e652d6865696768743a206e6f726d616c3b0a20206f766572666c6f773a2068696464656e3b0a20207472616e73666f726d2d6f726967696e3a20313439707820343870783b0a20206d617267696e3a20303b207d0a0a2e6d646c2d636172645f5f7375627469746c652d74657874207b0a2020666f6e742d73697a653a20313470783b0a2020636f6c6f723a207267626128302c302c302c20302e3534293b0a20206d617267696e3a20303b207d0a0a2e6d646c2d636172645f5f737570706f7274696e672d74657874207b0a2020636f6c6f723a207267626128302c302c302c20302e3534293b0a2020666f6e742d73697a653a203172656d3b0a20206c696e652d6865696768743a20313870783b0a20206f766572666c6f773a2068696464656e3b0a202070616464696e673a203136707820313670783b0a202077696474683a203930253b207d0a0a2e6d646c2d636172645f5f616374696f6e73207b0a2020666f6e742d73697a653a20313670783b0a20206c696e652d6865696768743a206e6f726d616c3b0a202077696474683a20313030253b0a20206261636b67726f756e642d636f6c6f723a207472616e73706172656e743b0a202070616464696e673a203870783b0a2020626f782d73697a696e673a20626f726465722d626f783b207d0a20202e6d646c2d636172645f5f616374696f6e732e6d646c2d636172642d2d626f72646572207b0a20202020626f726465722d746f703a2031707820736f6c6964207267626128302c20302c20302c20302e31293b207d0a0a2e6d646c2d636172642d2d657870616e64207b0a2020666c65782d67726f773a20313b207d0a0a2e6d646c2d636172645f5f6d656e75207b0a2020706f736974696f6e3a206162736f6c7574653b0a202072696768743a20313670783b0a2020746f703a20313670783b207d0a0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2020202024434f4e54454e54530a5c2a2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2a2f0a2f2a2a0a202a205354594c45204755494445205641524941424c45532d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d4465636c61726174696f6e73206f662053617373207661726961626c65730a202a202d2d2d2d2d5479706f6772617068790a202a202d2d2d2d2d436f6c6f72730a202a202d2d2d2d2d546578746669656c640a202a202d2d2d2d2d5377697463680a202a202d2d2d2d2d5370696e6e65720a202a202d2d2d2d2d526164696f0a202a202d2d2d2d2d4d656e750a202a202d2d2d2d2d4c6973740a202a202d2d2d2d2d4c61796f75740a202a202d2d2d2d2d49636f6e20746f67676c65730a202a202d2d2d2d2d466f6f7465720a202a202d2d2d2d2d436f6c756d6e0a202a202d2d2d2d2d436865636b626f780a202a202d2d2d2d2d436172640a202a202d2d2d2d2d427574746f6e0a202a202d2d2d2d2d416e696d6174696f6e0a202a202d2d2d2d2d50726f67726573730a202a202d2d2d2d2d42616467650a202a202d2d2d2d2d536861646f77730a202a202d2d2d2d2d477269640a202a202d2d2d2d2d44617461207461626c650a202a202d2d2d2d2d4469616c6f670a202a202d2d2d2d2d536e61636b6261720a202a202d2d2d2d2d546f6f6c7469700a202a202d2d2d2d2d436869700a202a0a202a204576656e2074686f75676820616c6c207661726961626c657320686176652074686520602164656661756c7460206469726563746976652c206d6f7374206f66207468656d0a202a2073686f756c64206e6f74206265206368616e67656420617320746865792061726520646570656e64656e74206f6e6520616e6f746865722e20546869732063616e2063617573650a202a2076697375616c20646973746f7274696f6e7320286c696b6520616c69676e6d656e742069737375657329207468617420617265206861726420746f20747261636b20646f776e0a202a20616e64206669782e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205459504f47524150485920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2057652772652073706c697474696e6720666f6e747320696e746f20227072656665727265642220616e642022706572666f726d616e63652220696e206f7264657220746f206f7074696d697a650a20202070616765206c6f6164696e672e20466f7220696d706f7274616e7420746578742c20737563682061732074686520626f64792c2077652077616e7420697420746f206c6f61640a202020696d6d6564696174656c7920616e64206e6f74207761697420666f72207468652077656220666f6e74206c6f61642c207768657265617320666f72206f746865722073656374696f6e732c0a20202073756368206173206865616465727320616e64207469746c65732c207765277265204f4b2077697468207468696e67732074616b696e67206120626974206c6f6e67657220746f206c6f61642e0a202020576520646f206861766520736f6d65206f7074696f6e616c20636c617373657320616e6420706172616d657465727320696e20746865206d6978696e732c20696e206361736520796f750a202020646566696e6974656c792077616e7420746f206d616b65207375726520796f75277265207573696e67207468652070726566657272656420666f6e7420616e6420646f6e2774206d696e640a20202074686520706572666f726d616e6365206869742e0a20202057652073686f756c642062652061626c6520746f20696d70726f7665206f6e2074686973206f6e63652043535320466f6e74204c6f6164696e67204c33206265636f6d6573206d6f72650a202020776964656c7920617661696c61626c652e0a2a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020434f4c4f525320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a2a0a2a0a2a204d6174657269616c2064657369676e20636f6c6f722070616c65747465732e0a2a204073656520687474703a2f2f7777772e676f6f676c652e636f6d2f64657369676e2f737065632f7374796c652f636f6c6f722e68746d6c0a2a0a2a2a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722050616c657474657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20636f6c6f72732e73637373202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020494d4147455320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6c6f722026205468656d657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205479706f67726170687920203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6d706f6e656e747320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205374616e6461726420427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202049636f6e20546f67676c657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526164696f20427574746f6e7320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020526970706c652065666665637420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c61796f757420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436f6e74656e74205461627320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020436865636b626f78657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020537769746368657320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20205370696e6e657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202054657874206669656c647320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204361726420203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020536c6964657273203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2050726f6772657373203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204c697374203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d20204974656d203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d202044726f70646f776e206d656e75203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020546f6f6c7469707320203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a203d3d3d3d3d3d3d3d3d3d2020466f6f74657220203d3d3d3d3d3d3d3d3d3d202a2f0a2f2a20544558544649454c44202a2f0a2f2a20535749544348202a2f0a2f2a205350494e4e4552202a2f0a2f2a20524144494f202a2f0a2f2a204d454e55202a2f0a2f2a204c495354202a2f0a2f2a204c41594f5554202a2f0a2f2a2049434f4e20544f47474c45202a2f0a2f2a20464f4f544552202a2f0a2f2a6d6567612d666f6f7465722a2f0a2f2a6d696e692d666f6f7465722a2f0a2f2a20434845434b424f58202a2f0a2f2a2043415244202a2f0a2f2a20436172642064696d656e73696f6e73202a2f0a2f2a20436f76657220696d616765202a2f0a2f2a20425554544f4e202a2f0a2f2a2a0a202a0a202a2044696d656e73696f6e730a202a0a202a2f0a2f2a20414e494d4154494f4e202a2f0a2f2a2050524f4752455353202a2f0a2f2a204241444745202a2f0a2f2a20534841444f5753202a2f0a2f2a2047524944202a2f0a2f2a2044415441205441424c45202a2f0a2f2a204449414c4f47202a2f0a2f2a20534e41434b424152202a2f0a2f2a20544f4f4c544950202a2f0a2f2a2043484950202a2f0a2f2a2a0a202a20436f70797269676874203230313520476f6f676c6520496e632e20416c6c205269676874732052657365727665642e0a202a0a202a204c6963656e73656420756e6465722074686520417061636865204c6963656e73652c2056657273696f6e20322e30202874686520224c6963656e736522293b0a202a20796f75206d6179206e6f742075736520746869732066696c652065786365707420696e20636f6d706c69616e6365207769746820746865204c6963656e73652e0a202a20596f75206d6179206f627461696e206120636f7079206f6620746865204c6963656e73652061740a202a0a202a202020202020687474703a2f2f7777772e6170616368652e6f72672f6c6963656e7365732f4c4943454e53452d322e300a202a0a202a20556e6c657373207265717569726564206279206170706c696361626c65206c6177206f722061677265656420746f20696e2077726974696e672c20736f6674776172650a202a20646973747269627574656420756e64657220746865204c6963656e7365206973206469737472696275746564206f6e20616e20224153204953222042415349532c0a202a20574954484f55542057415252414e54494553204f5220434f4e444954494f4e53204f4620414e59204b494e442c206569746865722065787072657373206f7220696d706c6965642e0a202a2053656520746865204c6963656e736520666f7220746865207370656369666963206c616e677561676520676f7665726e696e67207065726d697373696f6e7320616e640a202a206c696d69746174696f6e7320756e64657220746865204c6963656e73652e0a202a2f0a2f2a205479706f677261706879202a2f0a2f2a20536861646f7773202a2f0a2f2a20416e696d6174696f6e73202a2f0a2f2a204469616c6f67202a2f0a2e6d646c2d736861646f772d2d326470207b0a2020626f782d736861646f773a203020327078203270782030207267626128302c20302c20302c20302e3134292c20302033707820317078202d327078207267626128302c20302c20302c20302e32292c203020317078203570782030207267626128302c20302c20302c20302e3132293b207d0a0a2e6d646c2d736861646f772d2d336470207b0a2020626f782d736861646f773a203020337078203470782030207267626128302c20302c20302c20302e3134292c20302033707820337078202d327078207267626128302c20302c20302c20302e32292c203020317078203870782030207267626128302c20302c20302c20302e3132293b207d0a0a2e6d646c2d736861646f772d2d346470207b0a2020626f782d736861646f773a203020347078203570782030207267626128302c20302c20302c20302e3134292c20302031707820313070782030207267626128302c20302c20302c20302e3132292c20302032707820347078202d317078207267626128302c20302c20302c20302e32293b207d0a0a2e6d646c2d736861646f772d2d366470207b0a2020626f782d736861646f773a20302036707820313070782030207267626128302c20302c20302c20302e3134292c20302031707820313870782030207267626128302c20302c20302c20302e3132292c20302033707820357078202d317078207267626128302c20302c20302c20302e32293b207d0a0a2e6d646c2d736861646f772d2d386470207b0a2020626f782d736861646f773a203020387078203130707820317078207267626128302c20302c20302c20302e3134292c203020337078203134707820327078207267626128302c20302c20302c20302e3132292c20302035707820357078202d337078207267626128302c20302c20302c20302e32293b207d0a0a2e6d646c2d736861646f772d2d31366470207b0a2020626f782d736861646f773a20302031367078203234707820327078207267626128302c20302c20302c20302e3134292c203020367078203330707820357078207267626128302c20302c20302c20302e3132292c2030203870782031307078202d357078207267626128302c20302c20302c20302e32293b207d0a0a2e6d646c2d736861646f772d2d32346470207b0a2020626f782d736861646f773a203020397078203436707820387078207267626128302c20302c20302c20302e3134292c203020313170782031357078202d377078207267626128302c20302c20302c20302e3132292c20302032347078203338707820337078207267626128302c20302c20302c20302e32293b207d0a0a2e696f732d687962726964202e6d646c2d6c61796f75745f5f686561646572207b0a2020646973706c61793a206e6f6e653b207d0a0a2e696f732d687962726964202e6d646c2d6c61796f7574207b0a202070616464696e672d746f703a203070783b207d0a0a6d61696e207b0a202070616464696e673a20323070783b207d0a0a2e6d646c2d6c61796f75745f5f686561646572207b0a2020706f736974696f6e3a2066697865643b0a2020746f703a20303b207d0a0a2e6d646c2d6c61796f7574207b0a202070616464696e672d746f703a20353670783b207d0a0a406b65796672616d6573207374617475732d706f7075702d696e207b0a202066726f6d207b0a202020207472616e73666f726d3a207472616e736c6174653364282d3530252c20313030252c2030293b207d0a2020746f207b0a202020207472616e73666f726d3a207472616e736c6174653364282d3530252c2030252c2030293b207d207d0a0a2e7374617475732d706f707570207b0a2020706f736974696f6e3a2066697865643b0a2020626f74746f6d3a203070783b0a20206261636b67726f756e643a20626c61636b3b0a2020636f6c6f723a20236666663b0a20206c6566743a203530253b0a202070616464696e673a2033707820313570783b0a20207472616e73666f726d3a207472616e736c6174653364282d3530252c20313030252c2030293b0a20207472616e736974696f6e3a207472616e73666f726d20302e327320656173652d696e3b0a20207a2d696e6465783a20313030303b0a202077686974652d73706163653a206e6f777261703b207d0a0a2e7374617475732d706f7075702e73686f77207b0a20207472616e73666f726d3a207472616e736c6174653364282d3530252c2030252c2030293b207d0a0a2e7374617475732d706f7075702e68696465207b0a20207472616e736974696f6e3a207472616e73666f726d20302e327320656173652d696e3b0a20207472616e73666f726d3a207472616e736c6174653364282d3530252c20313030252c2030293b207d0a0a2e73746f72792d636172642d696d616765207b0a20206d617267696e3a2032307078206175746f3b0a20206d61782d77696474683a20313030253b0a2020746578742d6465636f726174696f6e3a206e6f6e653b0a2020636f6c6f723a207267626128302c20302c20302c20302e3837293b207d0a0a2e73746f72792d636172642d696d616765202e617574686f72207b0a2020646973706c61793a20626c6f636b3b0a2020746578742d7472616e73666f726d3a207570706572636173653b0a2020666f6e742d73697a653a20313170783b0a2020636f6c6f723a20236161613b0a20206d617267696e3a20357078203070783b207d0a0a2e73746f72792d636172642d696d616765203e202e696d67207b0a20206261636b67726f756e642d73697a653a20636f7665723b207d0a0a2e73746f72792d636172642d696d616765203e202e6e6f2d696d67207b0a20206865696768743a20303b0a2020666c65782d67726f773a20303b207d0a0a666967757265207b0a20206d617267696e3a20303b0a20206d617267696e2d626f74746f6d3a2032656d3b0a2020636f6c6f723a20236161613b207d0a0a696d67207b0a20206d61782d77696474683a20313030253b207d0a0a2e61727469636c65206831207b0a2020666f6e742d73697a653a20323670783b0a20206d617267696e2d746f703a203070783b207d0a0a756c207b0a202070616464696e672d6c6566743a20323070783b207d0a0a2f2a2320736f757263654d617070696e6755524c3d7374796c65732e6373732e6d6170202a2f', '{"content-type":["text/css"],"date":["Tue, 06 Dec 2016 20:24:47 GMT"],"connection":["close"],"transfer-encoding":["chunked"]}', 'https://alastairtest.ngrok.io/reader/styles.css', 'https://alastairtest.ngrok.io/reader/sw.js', 200);

insert into "cache" ("cache_id", "contents", "headers", "resource_url", "service_worker_url", "status") values ('reader-1481055887056', X'4f54544f000c008000030040434646205def1da400007318000043fa47504f53548b40410000486c0000298847535542de3ddc2c000071f4000001244f532f328d527d270000013000000060636d6170a9795d010000058c0000038868656164e4a03dce000000cc0000003668686561089b05760000010400000024686d74786d051c0300000914000004986b65726e8cd89bad00000dcc00003a9e6d6178700126500000000128000000066e616d6566a4b92200000190000003f9706f7374ff88001400000dac000000200001000000010000c0ed94155f0f3cf5000303e800000000c046fd1300000000c046fd13ff56ff2b05a5039d00000003000200000000000000010000039dff2b000005c6ff56ff5e05a500010000000000000000000000000000012600005000012600000002021c015e0005000402bc028a0000008c02bc028a000001dd003200fa000002000503080000020004000000010000000000000000000000007079727300000020fb0402ebff390047039d00d50000000100000000020102b50000002000030000001400f60001000000000000004a000000010000000000010014004a00010000000000020007005e00010000000000030011006500010000000000040014004a00010000000000050007007600010000000000060012007d00010000000000070051008f0001000000000008002100e000010000000000100014004a00010000000000110007005e0003000104090000009401010003000104090001002801950003000104090002000e01bd0003000104090003002201cb0003000104090004002401ed0003000104090005000e02110003000104090006002401ed000300010409000700a2021f0003000104090008004202c1436f70797269676874202863292043687269737469616e20536368776172747a2026205061756c204261726e65732c20323030352e20416c6c207269676874732072657365727665642e44453320446973706c617920456779707469616e526567756c6172464f4e544c41423a4f54464558504f52543030312e303030444533446973706c6179456779707469616e506c6561736520726566657220746f2074686520436f707972696768742073656374696f6e20666f722074686520666f6e742074726164656d61726b206174747269627574696f6e206e6f74696365732e43687269737469616e20536368776172747a2026205061756c204261726e65732c0043006f00700079007200690067006800740020002800630029002000430068007200690073007400690061006e00200053006300680077006100720074007a002000260020005000610075006c0020004200610072006e00650073002c00200032003000300035002e00200041006c006c0020007200690067006800740073002000720065007300650072007600650064002e00440045003300200044006900730070006c0061007900200045006700790070007400690061006e0052006500670075006c006100720046004f004e0054004c00410042003a004f00540046004500580050004f005200540044004500330044006900730070006c006100790045006700790070007400690061006e003000300031002e0030003000300050006c006500610073006500200072006500660065007200200074006f002000740068006500200043006f0070007900720069006700680074002000730065006300740069006f006e00200066006f0072002000740068006500200066006f006e0074002000740072006100640065006d00610072006b0020006100740074007200690062007500740069006f006e0020006e006f00740069006300650073002e00430068007200690073007400690061006e00200053006300680077006100720074007a002000260020005000610075006c0020004200610072006e00650073002c000000000000030000000300000122000100000000001c00030001000001220000010600000000000000000000000100000001000000000000000000000000000000000000011415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f70710072737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e00a0a10000a4a5a6000000000000000000b0b1b2b30000b60000b9babbf2bcbdbebfc0c1c2c3c4c5c6c700c9cacbcccdcecfd000d2d3d4d5d6d7d8d9dadbdcdddedfe000e2e3e4e5e6e7e8e9eaebecedeeeff0000402660000005e00400005001e0020007e00a900ab00b000b400b900ff01310142015301610178017e019202c702da02dd2014201a201e2020202220262030203a204420ac21222154215e219021922212226525cb2606e019e01ce022e027e039e05ae11df739fb04ffff00000020002100a000ab00ae00b200b600bb01310141015201600178017d019202c602d802db20132018201c20202022202620302039204420ac21222153215b219021922212226425cb2605e018e01ce022e027e030e041e11cf730fb00ffffffe1fff30000000e0000000000000000ffb5fec3ff6dfea6ff52fe8fff240000fe120000e0ae00000000e072e075e095e0a5e094e087e020df7a00000000df63df62de00de40dadcdaa3210220fd2088208420c520be1f9109ec0000000100000000005a0000006a006e00720078000000000000000000000000000000f2000000f2000000f400f80000000000000000000000000000000000ec00ee0000000000000000000000000000000000000000000000000000000000d8000000f200b30094009500f100a600110096009e009b009a00e900930010000f009d009800d200ed000e00ba00af00ac00b400b200bc00d800d600bd0072007300a0007400da007500d700d900de00db00dc00dd0002007600e200df00e000be0077001300a100e500e300e400780008000a0099007a0079007b007d007c007e00b0007f0081008000820083008500840086008700030088008a0089008b008d008c00c700b1008f008e009000910009000b00c900e700f000ef00e800ee00c500c600d300c300c400d400b500d100b700b800c800e1009f00cf00d000a200a301ee000000be0000029f0014021d0019022a0014010d00000207002e01a2001a02600000020efffe022e0014022bffff0212000b01d8001b010f0022014800140148000f00d6004c020e003a020e004700f900420175002d01f8002101f70024033a001b02a6001600d6002d013700260137000d016c0022020e003a00dd0030012e002900dd002d014e000402720024017a00210202000b01ed0017023a001301f800170234002601e80013023500220234002100e4003200e4002f01fa003d0204003d01fa0047019800180376002a028bfffd025d0014025b001c029f001402490014024400140293001c02d40014013b00140193000a028b0014022a00140360001402c3001402aa001c0229001402aa001c027c00140207002e0251000902a300010282000203a80004029f0014026000000212000b013a0040014e0019013a0021018a00160136fff601e8007f01d90010021dfff201c40019023e001e01ed00190137001401f400080244000e010d00090105ffd80211000e010d0008036e000e0246000e021d00190235000a0228001e015e000e01a2001a0156000d024600040211fffe0305fffe02110009020efffe01d8001b0170001c00d6004c0170002101900014028bfffd028bfffd025b001c0249001402c3001402aa001c02a3000101d9001001d9001001d9001001d9001001d9001001d9001001c4001901ed001901ed001901ed001901ed0019010d0009010d0009010dfffc010dfffd0246000e021d0019021d0019021d0019021d0019021d0019024600040246000402460004024600040194001a0150001e01c400190216002701ed0019032e00230237003702550014030800210308002102c9001501e8009001e8006b026100140394fffd02aa001c0366001403660014025700330257003a02440004032e00230346fffe0346fffe0175002d00d6002d033e002205c6002105c60021032e002202f80010021d000f0198002000f9004203600014034800220187ffa503540022037b0014019c0029019c002b02b1002d028bfffd028bfffd02aa001c038e001b037800190188001f02a0001f0175002f0175002e00d6002f00d6002e020e003a03740010020efffe0260000000d9ff56025e001b00fa002900fa002b023c0014023c00140374000f00da002d00d6002e0175002e04bc001b028bfffd02490014028bfffd0249001402490014013b0014013b0013013b0014013b001402aa001c02aa001c0358001902aa001c02a3000102a3000102a30001010d000901e8006a01e8005e01e8007a01e8008901e800bd01e8009701e800c801e8007401e8009701e8006a025e001b00be0000025700330257003a025b0000016e000001fc000001e20000023b000001e60000021f000001f9000002230000021f000002c3000002620000024f000002a20000025500000241000002a0000002de00000145000001b30000029c000002380000036a000002d7000002a400000241000002c40000029f000001ee00000271000002d3000002b0000003d2000002a9000002920000022f0000014a000000ab000000ab000002560024017a002101da000a01dc000d0236000e01e10015021e002401d8000c022e0026021e00200003000000000000ff85001400000000000000000000000000000000000000000000000100003a9a000109c23000000b0a8c00150023ffdd00150026ffec00150027ffa600150028ffec00150029ffd80015002bffd80015002cfff600150034ff7e00150036ffdd0015003affdd0015003dffb500150042ffdd00150044ffdd00150046ffe200150047000a0015004bfff600150054ffdd00150055000f00150056ffb000150057ffc400150058ffb000150059ffe20015005affba00150060ffec00150061ffec00150062ffb000150063ffec00150064ffc400150065ffec00150066ffce00150067fff100150069fff10015006afff10015006bffec0015006cffec0015006dffd800150099ffe20015009fffe2001500a0ff42001500a3ffe2001500b0ffdd001500bfffdd001500c0ffb0001500cfffe2001500d0ffe2001500e6ffec00160026fff60019002affec0019002bfff60019002cfff600190046fff600190047ffdd00190048fffb00190049ffbf0019004affdd0019004cffba00190069fff60019006afff60019006cfff1001a0023ffdd001a0026ffec001a0027ffa6001a0028ffec001a0029ffd8001a002bffd8001a002cfff6001a0034ff7e001a0036ffdd001a003affdd001a003dffb5001a0042ffdd001a0044ffdd001a0046ffe2001a0047000a001a004bfff6001a0054ffdd001a0055000f001a0056ffb0001a0057ffc4001a0058ffb0001a0059ffe2001a005affba001a0060ffec001a0061ffec001a0062ffb0001a0063ffec001a0064ffc4001a0065ffec001a0066ffce001a0067fff1001a0069fff1001a006afff1001a006bffec001a006cffec001a006dffd8001a0099ffe2001a009fffe2001a00a0ff42001a00a3ffe2001a00b0ffdd001a00bfffdd001a00c0ffb0001a00cfffe2001a00d0ffe2001a00e6ffec001b0023fff6001b0027fff6001b0029fff6001b002a000a001b002bffec001b003dfff6001b0046fff6001b00470014001b00480014001b0049000a001b004a000a001b004c000f001b004d000a001b00550028001b0056ffec001b0057fff6001b0058ffec001b0059fff6001b005a000a001b005d0032001b0062ffec001b0064fff6001b0066fff6001b0067fff6001b0068fff6001b0069fff6001b006afff6001b006cfff6001b0099fff6001b009ffff6001b00a3fff6001b00c0ffec001b00cffff6001b00d0fff6001d0026fff6001d0027ffd8001d002a0014001d002bfff6001d0034ffb0001d003dffc4001d00470019001d0049000a001d004bfff6001d004d000a001d0056ffe2001d0057ffec001d0058ffe2001d005affe2001d005c0014001d005d000f001d0062ffe2001d0064ffec001d0066ffec001d00690014001d006a0014001d006c0014001d00a0ff56001d00c0ffe2001e0024fff6001e0025ffe7001e0026ffdd001e002affd3001e002bffec001e002cfff1001f0023ffe2001f0024fff6001f0025000f001f0027ffdd001f0029ffe2001f002affe2001f002bfff6001f002cfff6001f0034000f001f0036ffd8001f003affd8001f0042ffd8001f0044ffd8001f0046fff6001f0047ffba001f0048ffd8001f0049ff92001f004aff92001f004cff92001f0056ffec001f0057ffe7001f0058ffec001f005afff6001f005dfff6001f0062ffec001f0064ffe7001f0067ffd8001f0068ffd8001f0069ffa6001f006affa6001f006cffc4001f00bfffd8001f00c0ffec00200024ffe700200025ffe200200026ffe200200027000a0020002affe20020002cffec00200034ffe20020003dffd800200046ffec00200047ffc400200049ffba0020004affc40020004bffc40020004cffb000200056000a00200058000a00200062000a00200069ffe20020006affe20020006bffd80020006cffe2002000a0ffc4002000c0000a00210023ffe200210024fff600210025000f00210027ffdd00210029ffe20021002affe20021002bfff60021002cfff600210034000f00210036ffd80021003affd800210042ffd800210044ffd800210046fff600210047ffba00210048ffd800210049ff920021004aff920021004cff9200210056ffec00210057ffe700210058ffec0021005afff60021005dfff600210062ffec00210064ffe700210067ffd800210068ffd800210069ffa60021006affa60021006cffb0002100bfffd8002100c0ffec00220023ffec00220027ffd800220028fff600220029ffe20022002bffec0022002cfff600220034ffba00220036ffec0022003affec0022003dffdd00220042ffec00220044ffec00220046ffec00220047001e0022004bfff600220054ffce00220055001e00220056ffc400220057ffd800220058ffc400220059fff10022005affce00220060ffe200220061ffe200220062ffc400220063ffe200220064ffd800220065ffe200220066ffd800220067fff600220068ffec00220069fff60022006afff60022006bffe20022006cffec0022006dffd800220099fff10022009ffff1002200a0ffa6002200a3fff1002200b0ffce002200bfffec002200c0ffc4002200cffff1002200d0fff1002200e6ffe200230015fff60023001afff60023001cfff60023001fffe200230021ffe200230022ffec00230032fff60023004fffec00230050fff600230070fff6002300bbffe2002300c3fff6002300c4fff6002300c5fff6002300c6fff600240015ffe200240018fff60024001affe20024001dffec0024001effec00240020ffec00240022000a0024004ffff600240093ffe70024009cffec002400c1ffec002400c2ffec002400c3ffd8002400c4ffe2002400c5ffd8002400c6ffe2002400d2fff6002400d5fff600250015fff60025001afff60025004fffec00250093fff6002500c3fff6002500c4fff6002500c5fff6002500c6fff600260015fff60026001afff60026004ffff6002600c3fff1002600c4fff6002600c5fff1002600c6fff600270015ffdd00270018ffec0027001affdd0027001dffec0027002afff60027004fffec00270093ffd80027009cffec002700c3ffd8002700c4ffdd002700c5ffd8002700c6ffdd002700d5ffec00280015fff60028001afff60028001dfff60028001ffff100280021fff100280093fff60028009cfff6002800bbfff1002800c3ffe7002800c4fff6002800c5ffe7002800c6fff600290015ffec00290018fff60029001affec0029001dfff60029001efff10029001ffff600290021fff60029002ffff10029004ffff100290093ffec0029009cfff6002900bbfff6002900c3ffe2002900c4ffec002900c5ffe2002900c6ffec002900d5fff6002a0015000a002a0016ffec002a0018000f002a0019ffe2002a001a000a002a001c000a002a001d0019002a001effdd002a001fffba002a0020ffec002a0021ffba002a0022ffce002a0027ffec002a002dffe2002a002effe2002a002fffe2002a0030fff6002a0032001e002a0033ffe2002a0050000a002a0070000a002a00930014002a0094ffe7002a0096fff6002a009c0019002a00b9ffec002a00baffec002a00bbffba002a00c1ffec002a00c2ffec002a00c4000a002a00c6000a002a00cdffec002a00ceffec002a00d2ffd8002a00d5000f002b0015ffec002b0018fff1002b001affec002b001cffec002b001dfff6002b001effec002b001ffff6002b0021fff6002b002fffec002b0032fff6002b004fffec002b0050ffec002b0070ffec002b0093fff6002b009cfff6002b00bbfff6002b00c3ffe2002b00c4ffec002b00c5ffe2002b00c6ffec002b00d2fff6002b00d5fff1002c001fffe2002c0021ffe2002c0022fff1002c004ffff6002c0093fff1002c00bbffe2002d0024fff6002d002affe7002d002cfff1002d0046fff6002d0047ffd8002d0048ffec002d0049ffc4002d004affce002d004cffc4002d0067fff6002d0069ffec002d006affec002d006cffec002e0024fff6002e002affe7002e002cfff1002e0046fff6002e0047ffd8002e0048ffec002e0049ffc4002e004affce002e004cffc4002e0067fff6002e0069ffec002e006affec002e006cffec002f0026ffec00300026ffe20030002affec00310025ffe200310026ffd80031002affd80031002bffec0031002cfff100330024fff600330025fff600330026ffec0033002bfff600330034ffe20033003dffec00330046ffec00330049ffdd0033004affe70033004bffdd0033004cffc90033006bfff60033006dfff6003300a0ffce00340015ff9c0034001aff9c0034001dffb00034001f000f00340020ffe200340021000f00340032ffec00340034001900340036ffec0034003affec0034003d001400340042ffec00340044ffec00340047ffd300340048ffe200340049ffb00034004affba0034004cffba0034004d000a0034004fffba00340056fff100340057fff100340058fff10034005afff600340062fff100340064fff100340067ffe700340068ffec00340069ffce0034006affce0034006cffce0034009affd80034009bffd80034009cffb0003400a0000a003400bb000f003400bfffec003400c0fff1003400c1ffe2003400c2ffe2003400c3ff9c003400c4ff9c003400c5ff9c003400c6ff9c003400d2ffd800350015fff100350019000f0035001afff100350020000f00350033001400350034fff100350049ffec0035004affec0035004bfff10035004cffe70035004fffec00350050fff600350054000a00350056000f00350057000a00350058000f0035005afff600350062000f00350064000a00350070fff6003500a0ffec003500b90014003500ba0014003500c0000f003500c1000f003500c2000f003500c3fff6003500c4fff1003500c5fff6003500c6fff1003500cd0014003500ce001400360054000f003600550014003600ba000a003600ce000a0037001fffd800370021ffd800370022ffec00370034ffe70037003dfff100370046fff600370049ffe70037004affe20037004bffd80037004cffd30037004fffec00370056000a00370058000a00370062000a00370066000a0037006bfff6003700a0ffce003700bbffd8003700c0000a00380033001400380054000f00380055000f00380056000a00380057000a00380058000a00380062000a00380064000a003800b9000f003800c0000a003800cd000f00390019ffce0039001fff9200390020ffc400390021ff9200390022ffba0039002dffd80039002effd800390033ffe200390034ffab00390036fff10039003afff10039003dffbf00390042fff100390044fff100390046fff10039004bffec00390054ffce00390055001400390056ffc400390057ffc900390058ffc400390059fff60039005affc400390060fff600390061fff600390062ffc400390063fff600390064ffc900390065fff600390066ffd300390067fff600390068fff60039006bffec0039006dffd800390099fff60039009ffff6003900a0ff7e003900a3fff6003900b9ffce003900baffe2003900bbff92003900bffff1003900c0ffc4003900c1ffc4003900c2ffc4003900cdffce003900ceffe2003900cffff6003900d0fff6003900d2ffe2003900e6fff6003a0015fff1003a001afff1003a0046fff1003a0049ffec003a004afff6003a004bfff6003a004cffec003a004ffff1003a0056000f003a0057000a003a0058000f003a0062000f003a0064000a003a00660014003a006bfff1003a00c0000f003a00c3fff1003a00c4fff1003a00c5fff1003a00c6fff1003b0056fff6003b0057fff6003b0058fff6003b005afff1003b0062fff6003b0064fff6003b0067fff6003b0068fff1003b0069ffec003b006affec003b006cffec003b00c0fff6003b00c3ffec003b00c5ffec003c0056fff6003c0057fff6003c0058fff6003c005afff1003c0062fff6003c0064fff6003c0067fff6003c0068fff1003c0069ffec003c006affec003c006cffec003c00c0fff6003c00c3ffec003c00c5ffec003d0015000a003d001a000a003d001c000a003d001fffdd003d0021ffdd003d0022fff6003d002dfff6003d002efff6003d0032000f003d0034ffe2003d003dffdd003d0046fff6003d0050000a003d0054fff1003d00550014003d0056fff1003d0057fff1003d0058fff1003d005affec003d0060fff6003d0061fff6003d0062fff1003d0063fff6003d0064fff1003d0065fff6003d0066fff6003d0067fff1003d0068fff6003d0069fff1003d006afff1003d006bffec003d006cfff1003d006dfff1003d0070000a003d0099fff6003d00a0ffd8003d00bbffdd003d00c0fff1003d00c4000a003d00c6000a003d00e6fff6003e0015fff6003e001afff6003e0020ffc4003e0036ffdd003e003affdd003e0042ffdd003e0044ffdd003e0046fff1003e0056ffe7003e0057ffe2003e0058ffe7003e005afff1003e0062ffe7003e0063fff1003e0064ffe2003e0067ffe7003e0068ffe7003e0069ffce003e006affce003e006cffce003e00b9ffe2003e00bfffdd003e00c0ffe7003e00c1ffc4003e00c2ffc4003e00c3fff1003e00c4fff6003e00c5fff1003e00c6fff6003e00cdffe2003e00d2ffce003f0015ffba003f0019000f003f001affba003f001dffbf003f0032fff1003f00330014003f0034000f003f00360014003f003a0014003f003d000f003f00420014003f00440014003f0046fff6003f0047ffd8003f0048fff1003f0049ffb0003f004affb0003f004cffb0003f004fffd8003f0054000f003f0056000f003f0057000a003f0058000f003f0062000f003f0064000a003f0069ffd8003f006affd8003f006cffd8003f009cffbf003f00bf0014003f00c0000f003f00c3ffb0003f00c4ffba003f00c5ffb0003f00c6ffba00400056fff600400057fff600400058fff60040005afff100400062fff600400064fff600400067fff600400068fff100400069ffec0040006affec0040006cffec004000c0fff6004000c3ffec004000c5ffec0041001fffec00410021ffec0041003dfff600410047000a00410048000a00410049000a0041004a000a0041004c000a00410055000a0041005afff60041006dfff6004100a0ffec004100bbffec0042001fffd800420021ffd800420022ffec00420034ffe70042003dfff100420046fff600420049ffe70042004affe20042004bffd80042004cffd30042004fffec00420056000a00420058000a00420062000a00420066000a0042006bfff6004200a0ffce004200bbffd8004200c0000a00430014001900430015001400430019fff10043001a00140043001d001e0043001fffba00430021ffba00430022ffec00430032001400430034ffd80043003600190043003a00190043003dffce0043004200190043004400190043004700140043004bffec0043004cfff600430055001400430056fff100430057fff100430058fff10043005afff10043005c000a0043005d000a00430060000a00430061000a00430062fff100430063000a00430064fff100430065000a00430068000a00430069000f0043006a000f0043006c000f0043009c001e004300a0ffa1004300b9fff6004300ba000a004300bbffba004300bf0019004300c0fff1004300c3000f004300c40014004300c5000f004300c60014004300cdfff6004300ce000a004300d2000f004300e6000a0044001c00140044001fffd800440022001e0044002e001e00440034ffe70044003dfff100440046fff600440049ffe70044004affe20044004cffd30044004d000f0044004fffec00440050001400440056000a00440058000a0044005a00140044005d001e00440062000a00440066000a0044006bfff6004400700014004400bbffd8004400c0000a00450015ffdd0045001affdd0045001cfff60045001dffec00450020ffe200450032fff600450036fff10045003afff100450042fff100450044fff100450046ffe700450047ffe200450048ffe200450049ffce0045004affd30045004cffbf0045004fffec00450050fff100450056ffe700450057ffe700450058ffe70045005affec00450062ffe700450064ffe700450067fff100450068fff100450069ffe20045006affe20045006cffe200450070fff10045009cffec004500a0000a004500b9ffec004500bffff1004500c0ffe7004500c1ffe2004500c2ffe2004500c3ffd8004500c4ffdd004500c5ffd8004500c6ffdd004500cdffec004500d2ffe200460015fff600460019000f0046001afff60046001dfff600460020000a00460033000a00460034fffb00460046fff100460049fff10046004afff10046004bfff10046004cfff10046004fffec00460054000a00460055000a00460056000f00460057000a00460058000f0046005afff600460062000f00460064000a00460069fff60046006afff60046006bfff60046006cfff60046009cfff6004600c0000f004600c1000a004600c2000a004600c3ffec004600c4fff6004600c5ffec004600c6fff600470014001400470015001400470019ffec0047001a00140047001c00140047001d00190047001fffba00470020ffc400470021ffba00470022ffe20047002dffd80047002effd800470032001e00470033ffec00470034ffd30047003dffdd00470047000f00470048000a0047004bfff60047004f001e00470050000a00470054ffec00470055001900470056ffe200470057ffe200470058ffe20047005affdd00470062ffe200470064ffe200470066ffec00470069000a0047006a000a0047006c000a0047006dfff100470070000a0047009c0019004700a0ffba004700b9ffd8004700bbffba004700c0ffe2004700c1ffc4004700c2ffc4004700c3000a004700c40014004700c5000a004700c60014004700cdffd8004700d2ffe200480014000f00480015000a0048001a000a0048001c00140048001d000a0048001fffd800480021ffd800480022ffec0048002dffec0048002effec00480032001900480034ffe20048003dffec00480046fff600480047000a00480048000a00480049000a0048004a000a0048004c000a00480050000a0048005500140048005afff600480070000a0048009c000a004800a0ffc9004800b9fff6004800bbffd8004800c4000a004800c6000a004800cdfff600490019ffce0049001c000a0049001d000a0049001fff9200490020ffba00490021ff9200490022ffba0049002dffc40049002effc400490032001400490033ffc400490034ffb000490036ffe70049003affe70049003dffc400490042ffe700490044ffe700490046ffe200490048000a00490049000a0049004a000a0049004c000a0049004dfff600490050000a00490054ffba00490055001400490056ffb500490057ffb500490058ffb500490059ffec0049005affb00049005cffec0049005dffec00490060ffd800490061ffd800490062ffb500490063ffd800490064ffb500490065ffd800490066ffc400490067ffd800490068ffd800490069ffdd0049006affdd0049006bffd30049006cffdd0049006dffce00490070000a00490099ffec0049009c000a0049009fffec004900a0ff7e004900a3ffec004900b9ffba004900baffce004900bbff92004900bfffe7004900c0ffb5004900c1ffba004900c2ffba004900c3fff6004900c5fff6004900cdffba004900ceffce004900cfffec004900d0ffec004900d2ffc4004900e6ffd8004a0019ffd8004a001c000a004a001fff92004a0020ffc4004a0021ff92004a0022ffc9004a002dffce004a002effce004a0032000f004a0033ffc4004a0034ffba004a0036ffe2004a003affe2004a003dffc4004a0042ffe2004a0044ffe2004a0046ffdd004a0048000a004a0049000a004a004a000a004a004c000a004a004dfff6004a0050000a004a0054ffbf004a00550014004a0056ffba004a0057ffba004a0058ffba004a0059ffe2004a005affb0004a005cfff1004a005dfff1004a0060ffe2004a0061ffe2004a0062ffba004a0063ffe2004a0064ffba004a0065ffe2004a0066ffc4004a0067ffdd004a0068ffe2004a0069ffe2004a006affe2004a006bffd8004a006cffe2004a006dffce004a0070000a004a0099ffe2004a009fffe2004a00a0ff92004a00a3ffe2004a00b9ffc4004a00baffd8004a00bbff92004a00bfffe2004a00c0ffba004a00c1ffc4004a00c2ffc4004a00c3fff1004a00c5fff1004a00cdffc4004a00ceffd8004a00cfffe2004a00d0ffe2004a00d2ffce004a00e6ffe2004b0015ffe7004b0019fff6004b001affe7004b001dffe7004b0020ffc4004b0033fff6004b0036ffd8004b003affd8004b0042ffd8004b0044ffd8004b0046ffec004b0047fff6004b004ffff6004b0056ffec004b0057ffec004b0058ffec004b0062ffec004b0064ffec004b0067ffe7004b0068ffec004b0069ffe2004b006affe2004b006cffe2004b009cffe7004b00b9ffce004b00bfffd8004b00c0ffec004b00c1ffc4004b00c2ffc4004b00c3ffdd004b00c4ffe7004b00c5ffdd004b00c6ffe7004b00cdffce004b00d2ffba004c0019ffce004c001c000f004c001fff92004c0020ffb0004c0021ff92004c0022ffc4004c002dffc4004c002effc4004c00320014004c0033ffb5004c0034ffba004c0036ffd3004c003affd3004c003dffdd004c0042ffd3004c0044ffd3004c0046ffe2004c0048000a004c0049000a004c004a000a004c004c000a004c0050000f004c0054ffbf004c0055001e004c0056ffb5004c0057ffb5004c0058ffb5004c0059ffdd004c005affb0004c005cfff1004c005dfff1004c0060ffd8004c0061ffd8004c0062ffb5004c0063ffd8004c0064ffb5004c0065ffd8004c0066ffbf004c0067ffdd004c0068ffd8004c0069ffd8004c006affd8004c006bffce004c006cffd8004c006dffce004c0070000f004c0099ffdd004c009fffdd004c00a0ffa1004c00a3ffdd004c00b9ff9c004c00baffba004c00bbff92004c00bfffd3004c00c0ffb5004c00c1ffb0004c00c2ffb0004c00c3fff1004c00c5fff1004c00cdff9c004c00ceffba004c00cfffdd004c00d0ffdd004c00d2ffc4004c00e6ffd8004d0019000f004d001c000f004d001d000a004d00320014004d00330014004d003d000a004d0054000a004d00550014004d0069fff6004d006afff6004d006cfff6004d009c000a004d00c3fff6004d00c5fff6004e0023fff6004e0027fff6004e002a000a004e002bffec004e003dfff1004e0046fff6004e0047000a004e0048000a004e0049000a004e004a000a004e004c000f004e0055000f004e0056ffec004e0057fff6004e0058ffec004e0059fff6004e005d001e004e0062ffec004e0064fff6004e0068fff6004e0069fff1004e006afff1004e006cfff1004e0099fff6004e009ffff6004e00a0fff6004e00a3fff6004e00c0ffec004e00cffff6004e00d0fff6004f0023ffec004f0029fff6004f002affec004f002cfff1004f0036ffec004f003affec004f0042ffec004f0044ffec004f0047ffe2004f0048ffec004f0049ffba004f004affc9004f004cffc4004f0056fff6004f0058fff6004f005a001e004f005d0046004f0062fff6004f0069ffd8004f006affd8004f00bfffec004f00c0fff600540015ffec0054001affec0054001dffec00540032fff60054004fffc400540067fff600540069fff60054006afff60054006cfff60054009cffec005400c3ffe7005400c4ffec005400c5ffe7005400c6ffec00550015ffec0055001affec0055001cfff10055001dfff60055001ffff600550021fff600550032ffec0055004fffe200550050ffec00550069fff60055006afff60055006bfff10055006cfff600550070ffec0055009cfff6005500bbfff6005500c3ffe2005500c4ffec005500c5ffe2005500c6ffec00560014000f00560015000a00560019000a0056001a000a0056001d000a00560022000a00560033000f00560036000a0056003a000a0056003d000f00560042000a00560044000a00560049ffe70056004afff60056004cffdd0056004d000f0056004fffec0056009c000a005600a0000a005600ba000f005600bf000a005600c4000a005600c6000a005600ce000f00570015fff60057001afff60057001dfff600570032fff60057004ffff60057009cfff6005700c3fff1005700c4fff6005700c5fff1005700c6fff600580015fff10058001afff10058001dffec00580032fff60058004fffd80058006bfff60058009cffec005800c3ffec005800c4fff1005800c5ffec005800c6fff100590014001e00590015003c0059001a003c0059001c00460059001d003c0059003200410059004f003c00590050003c00590056fffb00590058fffb0059005bfff60059005efff60059005ffff600590060000a00590061000a00590062fffb00590063000a00590065000a0059006900140059006a00140059006c001400590070003c0059009c003c005900b9fff6005900c0fffb005900c30028005900c4003c005900c50028005900c6003c005900cdfff6005900e6000a005a001c000a005a001d000a005a0022001e005a0032fff6005a004fffec005a0056fff6005a0058fff6005a0062fff6005a0069000a005a006a000a005a006c000a005a009c000a005a00b9fff6005a00c0fff6005a00cdfff6005b0015ffd8005b001affd8005b001dffe2005b0032ffec005b004fffce005b005afff1005b0067fff1005b0069fff1005b006afff1005b006cfff1005b009cffe2005b00b9fff1005b00c3ffdd005b00c4ffd8005b00c5ffdd005b00c6ffd8005b00cdfff1005c0015ffec005c001affec005c004fffec005c0067fff6005c0069fff6005c006afff6005c00c3ffec005c00c4ffec005c00c5ffec005c00c6ffec005d0015ffec005d001affec005d004fffec005d005d000a005d0069fff6005d006afff6005d00c3ffec005d00c4ffec005d00c5ffec005d00c6ffec005e0020ffe2005e004fffec005e0056fff1005e0057fff1005e0058fff1005e005afff1005e0062fff1005e0064fff1005e00b9ffec005e00c0fff1005e00c1ffe2005e00c2ffe2005e00cdffec005e00d2ffe7005f0015fff6005f001afff6005f001dfff6005f0032fff6005f004ffff6005f009cfff6005f00c3fff1005f00c4fff6005f00c5fff1005f00c6fff600600015ffd80060001affd80060001dffe200600032ffec0060004fffce0060005afff100600067fff100600069fff10060006afff10060006cfff10060009cffe2006000b9fff1006000c3ffdd006000c4ffd8006000c5ffdd006000c6ffd8006000cdfff100610015ffd80061001affd80061001dffe200610032ffec0061004fffce0061005afff100610067fff100610069fff10061006afff10061006cfff10061009cffe2006100b9fff1006100c3ffdd006100c4ffd8006100c5ffdd006100c6ffd8006100cdfff100620015ffe20062001affe20062001cffec0062001dffe20062001fffec00620020000a00620021ffec00620022fff600620032ffe70062004fffc400620050ffec00620069fff60062006afff60062006bffe70062006cfff60062006dfffb00620070ffec0062009cffe2006200bbffec006200c1000a006200c2000a006200c3ffd8006200c4ffe2006200c5ffd8006200c6ffe200630015ffec0063001affec0063001cfff10063001dfff60063001ffff600630021fff600630032ffec0063004fffe200630050ffec00630069fff60063006afff60063006bfff10063006cfff600630070ffec0063009cfff6006300bbfff6006300c3ffe2006300c4ffec006300c5ffe2006300c6ffec0064001c001400640022001400640032ffec0064004fffd300640050000a0064005d003c00640070000a006400b9fff1006400c3fff1006400c5fff1006400cdfff100650015000a0065001a000a0065001d00140065001fffd300650021ffd300650022ffec0065002dfff60065002efff60065004ffff600650054fff600650056fffb00650057fff600650058fffb0065005afff600650062fffb00650064fff600650068000a0065006900140065006a00140065006c00140065009c0014006500b9fff1006500bbffd3006500c0fffb006500c3000a006500c4000a006500c5000a006500c6000a006500cdfff1006500d2fff60066001cfff60066001dfff600660032fff10066004fffce0066005afff60066009cfff6006600c3fff6006600c5fff6006600d2fff600670020fff60067004ffff600670056fffb00670057fff600670058fffb00670059fff60067005afff100670062fffb00670064fff600670067fff600670099fff60067009ffff6006700a3fff6006700b9fff6006700c0fffb006700c1fff6006700c2fff6006700cdfff6006700cffff6006700d0fff600680015ffec0068001affec0068001dffe700680032ffec0068004fffd30068009cffe7006800b9fff6006800c3ffe2006800c4ffec006800c5ffe2006800c6ffec006800cdfff600690015000a00690019ffec0069001a000a0069001cfff60069001d00140069001fffa600690020ffe200690021ffa600690022ffd80069002dffec0069002effec00690033ffe70069004ffff600690050fff100690056fff600690057fff600690058fff60069005affec0069005c000f0069005d000f00690062fff600690064fff600690067000a0069006800140069006900140069006a00140069006c00140069006dfff600690070fff10069009c0014006900b9ffdd006900bbffa6006900c0fff6006900c1ffe2006900c2ffe2006900c3000a006900c4000a006900c5000a006900c6000a006900cdffdd006900d2ffec006a0015000a006a0019ffec006a001a000a006a001cfff6006a001d0014006a001fffa6006a0020ffe2006a0021ffa6006a0022ffd8006a002dffec006a002effec006a0033ffe7006a004ffff6006a0050fff1006a0056fff6006a0057fff6006a0058fff6006a005affec006a005c000f006a005d000f006a0062fff6006a0064fff6006a0067000a006a00680014006a00690014006a006a0014006a006c0014006a006dfff6006a0070fff1006a009c0014006a00b9ffdd006a00bbffa6006a00c0fff6006a00c1ffe2006a00c2ffe2006a00c3000a006a00c4000a006a00c5000a006a00c6000a006a00cdffdd006a00d2ffec006b0020ffd8006b0033fff6006b004fffe2006b0056ffe7006b0057fff1006b0058ffe7006b005afff6006b0062ffe7006b0064fff1006b00b9ffd8006b00c0ffe7006b00c1ffd8006b00c2ffd8006b00cdffd8006b00d2ffe2006c0015000a006c0019ffec006c001a000a006c001cfff6006c001d0014006c001fffa6006c0020ffe2006c0021ffa6006c0022ffd8006c002dffec006c002effec006c0033ffe7006c004ffff6006c0050fff1006c0056fff6006c0057fff6006c0058fff6006c005affec006c005c000f006c005d000f006c0062fff6006c0064fff6006c0067000a006c00680014006c00690014006c006a0014006c006c0014006c006dfff6006c0070fff1006c009c0014006c00b9ffdd006c00bbffa6006c00c0fff6006c00c1ffe2006c00c2ffe2006c00c3000a006c00c4000a006c00c5000a006c00c6000a006c00cdffdd006c00d2ffec006d0032fff6006d004fffd8006d0056fffb006d0058fffb006d005afff1006d0062fffb006d006dfff6006d00b9fff6006d00c0fffb006d00cdfff6006e0023fff6006e0027fff6006e002a000a006e002bffec006e003dfff1006e0046fff6006e0047000a006e0048000a006e0049000a006e004a000a006e004c000f006e0055000f006e0056ffec006e0057fff6006e0058ffec006e0059fff6006e005d001e006e0062ffec006e0064fff6006e0068fff6006e0069fff1006e006afff1006e006cfff1006e0099fff6006e009ffff6006e00a0fff6006e00a3fff6006e00c0ffec006e00cffff6006e00d0fff600930024000f00930027ffba00930029ffec0093002a00140093002bfff600950023fff600950025000f00950027ffec00950029fff60095002bfff60095002cfff60096002afff60096002cfff600990015ffd80099001affd80099001cfff10099001dffe200990032ffec0099004fffd800990050ffec0099005affec0099005dfff100990060fff600990061fff600990063fff600990065fff600990067ffec00990068ffec00990069ffd80099006affd80099006bffec0099006cffdd0099006dfff600990070ffec0099009cffe2009900c3ffce009900c4ffd8009900c5ffce009900c6ffd8009900d2ffec009900e6fff6009a0025fff1009a0026ffe7009a002bfff6009a0034ffd8009a003dffec009a0046fff6009a0049ffdd009a004affe2009a004bffce009a004cffc4009a00a0ffbf009b0025fff1009b0026ffe7009b002bfff6009b0034ffd8009b003dffec009b0046fff6009b0049ffdd009b004affe2009b004bffce009b004cffc4009b00a0ffbf009f0014001e009f0015003c009f001a003c009f001c0046009f001d003c009f00320041009f004f003c009f0050003c009f0056fffb009f0058fffb009f005bfff6009f005efff6009f005ffff6009f0060000a009f0061000a009f0062fffb009f0063000a009f0065000a009f00690014009f006a0014009f006c0014009f0070003c009f009c003c009f00b9fff6009f00c0fffb009f00c30028009f00c4003c009f00c50028009f00c6003c009f00cdfff6009f00e6000a00a00033001400a000b9000f00a000cd000f00a30015fff600a3001afff600a3001dfff600a30032fff600a3004ffff600a3009cfff600a300c3fff100a300c4fff600a300c5fff100a300c6fff600a60024000a00a6002a001400b00015fff100b0001afff100b0001dffec00b00032fff600b0004fffd800b0009cffec00b000c3ffec00b000c4fff100b000c5ffec00b000c6fff100b20023fff600b20026fff100b20027fff600b20029ffec00b2002affec00b2002bffec00b2002cffec00b20036ffec00b2003affec00b20042ffec00b20044ffec00b20046ffe200b20047ffec00b20048ffe200b20049ffce00b2004affd300b2004bffec00b2004cffc900b20054fff600b20056ffe700b20057fff600b20058ffe700b20059fff600b2005d002300b20062ffe700b20064fff600b20066fffb00b20067fff100b20068fff600b20069ffec00b2006affec00b2006cfff600b20099fff600b2009ffff600b200a3fff600b200b0fff600b200bfffec00b200c0ffe700b200cffff600b200d0fff600b30046fff600b30048fff600b30049ffe700b3004affec00b3004cffe700b3005d001400b30069fff600b3006afff600b60027ffe200b6002a002800b9002afff600b9002cfff600b90046fff600b90049ffce00b9004affd800b9004cffba00b900a0fff600ba0025fff600ba0026fff100ba002affe200ba002cffe700ba003dffec00ba0046fff100ba0047ffd800ba0048fff600ba0049ffba00ba004affc400ba004bffce00ba004cff9c00ba0069ffdd00ba006affdd00ba006bffd800ba006cffdd00ba006dfff600ba00a0ffe200bb0023ffe200bb0024fff600bb0025000f00bb0027ffdd00bb0029ffe200bb002affe200bb002bfff600bb002cfff600bb0034000f00bb0036ffd800bb003affd800bb0042ffd800bb0044ffd800bb0046fff600bb0047ffba00bb0048ffd800bb0049ff9200bb004aff9200bb004cff9200bb0056ffec00bb0057ffe700bb0058ffec00bb005afff600bb005dfff600bb0062ffec00bb0064ffe700bb0067ffd800bb0068ffd800bb0069ffa600bb006affa600bb006cffb000bb00bfffd800bb00c0ffec00bf0033001400bf00b9000f00bf00cd000f00c00015fff100c0001afff100c0001dffec00c00032fff600c0004fffd800c0009cffec00c000c3ffec00c000c4fff100c000c5ffec00c000c6fff100c10024ffe700c10025ffe200c10026ffe200c10027000a00c1002affe200c1002cffec00c10034ffe200c1003dffd800c10046ffec00c10047ffc400c10049ffba00c1004affc400c1004bffc400c1004cffb000c10056000a00c10058000a00c10062000a00c10069ffe200c1006affe200c1006bffd800c1006cffe200c100a0ffc400c100c0000a00c20024ffe700c20025ffe200c20026ffe200c20027000a00c2002affe200c2002cffec00c20034ffe200c2003dffd800c20046ffec00c20047ffc400c20049ffba00c2004affc400c2004bffc400c2004cffb000c20056000a00c20058000a00c20062000a00c20069ffe200c2006affe200c2006bffd800c2006cffe200c200a0ffc400c200c0000a00c30023fff100c30026fff600c30027ffc900c30029fff100c3002a000a00c3002bffe700c30034ff8d00c30036fff600c3003afff600c3003dffba00c30042fff600c30044fff600c30046fff100c30047001400c30048000a00c3004bfff600c30054fff100c30055000f00c30056ffd300c30057ffdd00c30058ffd300c30059fff600c3005affd800c30062ffd300c30064ffdd00c30066fff100c30069000a00c3006a000a00c3006dffec00c30099fff600c3009ffff600c300a0ff4c00c300a3fff600c300b0fff100c300bffff600c300c0ffd300c300cffff600c300d0fff600c40023ffdd00c40026ffec00c40027ffa600c40028ffec00c40029ffd800c4002bffd800c4002cfff600c40034ff7e00c40036ffdd00c4003affdd00c4003dffb500c40042ffdd00c40044ffdd00c40046ffe200c40047000a00c4004bfff600c40054ffdd00c40055000f00c40056ffb000c40057ffc400c40058ffb000c40059ffe200c4005affba00c40060ffec00c40061ffec00c40062ffb000c40063ffec00c40064ffc400c40065ffec00c40066ffce00c40067fff100c40069fff100c4006afff100c4006bffec00c4006cffec00c4006dffd800c40099ffe200c4009fffe200c400a0ff4200c400a3ffe200c400b0ffdd00c400bfffdd00c400c0ffb000c400cfffe200c400d0ffe200c400e6ffec00c50023fff100c50026fff600c50027ffc900c50029fff100c5002a000a00c5002bffe700c50034ff8d00c50036fff600c5003afff600c5003dffba00c50042fff600c50044fff600c50046fff100c50047001400c50048000a00c5004bfff600c50054fff100c50055000f00c50056ffd300c50057ffdd00c50058ffd300c50059fff600c5005affd800c50062ffd300c50064ffdd00c50066fff100c50069000a00c5006a000a00c5006dffec00c50099fff600c5009ffff600c500a0ff4c00c500a3fff600c500b0fff100c500bffff600c500c0ffd300c500cffff600c500d0fff600c60023ffdd00c60026ffec00c60027ffa600c60028ffec00c60029ffd800c6002bffd800c6002cfff600c60034ff7e00c60036ffdd00c6003affdd00c6003dffb500c60042ffdd00c60044ffdd00c60046ffe200c60047000a00c6004bfff600c60054ffdd00c60055000f00c60056ffb000c60057ffc400c60058ffb000c60059ffe200c6005affba00c60060ffec00c60061ffec00c60062ffb000c60063ffec00c60064ffc400c60065ffec00c60066ffce00c60067fff100c60069fff100c6006afff100c6006bffec00c6006cffec00c6006dffd800c60099ffe200c6009fffe200c600a0ff4200c600a3ffe200c600b0ffdd00c600bfffdd00c600c0ffb000c600cfffe200c600d0ffe200c600e6ffec00cc0023fff600cc0027ffec00cd002afff600cd002cfff600cd0046fff600cd0049ffce00cd004affd800cd004cffba00cd00a0fff600ce0025fff600ce0026fff100ce002affe200ce002cffe700ce003dffec00ce0046fff100ce0047ffd800ce0048fff600ce0049ffba00ce004affc400ce004bffce00ce004cff9c00ce0069ffdd00ce006affdd00ce006bffd800ce006cffdd00ce006dfff600ce00a0ffe200d00015fff600d0001afff600d0001dfff600d00032fff600d0004ffff600d0009cfff600d000c3fff100d000c4fff600d000c5fff100d000c6fff600d20024ffec00d20025ffec00d20026ffec00d2002affd800d2002bfff600d2002cfff600d20034ffd800d2003dffd800d20046ffec00d20047ffe200d20049ffc400d2004affce00d2004bffba00d2004cffc400d2004dfff600d20069ffec00d2006affec00d2006bffe200d2006cffec00d200a0ffa600d30023ffe200d30024fff600d30025000f00d30027ffdd00d30029ffe200d3002affe200d3002bfff600d3002cfff600d30034000f00d30036ffd800d3003affd800d30042ffd800d30044ffd800d30046fff600d30047ffba00d30048ffd800d30049ff9200d3004aff9200d3004cff9200d30056ffec00d30057ffe700d30058ffec00d3005afff600d3005dfff600d30062ffec00d30064ffe700d30067ffd800d30068ffd800d30069ffa600d3006affa600d3006cffc400d300bfffd800d300c0ffec00d40023ffe200d40024fff600d40025000f00d40027ffdd00d40029ffe200d4002affe200d4002bfff600d4002cfff600d40034000f00d40036ffd800d4003affd800d40042ffd800d40044ffd800d40046fff600d40047ffba00d40048ffd800d40049ff9200d4004aff9200d4004cff9200d40056ffec00d40057ffe700d40058ffec00d4005afff600d4005dfff600d40062ffec00d40064ffe700d40067ffd800d40068ffd800d40069ffa600d4006affa600d4006cffc400d400bfffd800d400c0ffec000000010000000a001e002c00016c61746e0008000400000000ffff0001000000016b65726e0008000000010000000100040002000000010008000128da00040000007200ee01a801ae01e0029a0324038603a004260484050a05c40602064c066e068c06c206f4073a07cc08260840087608ac08b208bc08d2090c09c20a440a560aa40ad20ba00bf20c2c0c660d0c0d8a0e180e520e880ed60fa00ffe10ac113211f4126e1380148a1518161e165816d2172c176617b8181a1844187218f0192e1974199e19c81a021a2c1a721ab81b1e1b701b9e1c181c3e1c901cc21d681e0e1e4c1ef21f1c1f961fac1fc61fd020422070209e211c212a2154215e2188222a224c2256227422be23442352237c23da243824d2258c262626e026ea27082752277c27ce2854002e0023ffdd0026ffec0027ffa60028ffec0029ffd8002bffd8002cfff60034ff7e0036ffdd003affdd003dffb50042ffdd0044ffdd0046ffe20047000a004bfff60054ffdd0055000f0056ffb00057ffc40058ffb00059ffe2005affba0060ffec0061ffec0062ffb00063ffec0064ffc40065ffec0066ffce0067fff10069fff1006afff1006bffec006cffec006dffd80099ffe2009fffe200a0ff4200a3ffe200b0ffdd00bfffdd00c0ffb000cfffe200d0ffe200e6ffec00010026fff6000c002affec002bfff6002cfff60046fff60047ffdd0048fffb0049ffbf004affdd004cffba0069fff6006afff6006cfff1002e0023ffdd0026ffec0027ffa60028ffec0029ffd8002bffd8002cfff60034ff7e0036ffdd003affdd003dffb50042ffdd0044ffdd0046ffe20047000a004bfff60054ffdd0055000f0056ffb00057ffc40058ffb00059ffe2005affba0060ffec0061ffec0062ffb00063ffec0064ffc40065ffec0066ffce0067fff10069fff1006afff1006bffec006cffec006dffd80099ffe2009fffe200a0ff4200a3ffe200b0ffdd00bfffdd00c0ffb000cfffe200d0ffe200e6ffec00220023fff60027fff60029fff6002a000a002bffec003dfff60046fff600470014004800140049000a004a000a004c000f004d000a005500280056ffec0057fff60058ffec0059fff6005a000a005d00320062ffec0064fff60066fff60067fff60068fff60069fff6006afff6006cfff60099fff6009ffff600a3fff600c0ffec00cffff600d0fff600180026fff60027ffd8002a0014002bfff60034ffb0003dffc4004700190049000a004bfff6004d000a0056ffe20057ffec0058ffe2005affe2005c0014005d000f0062ffe20064ffec0066ffec00690014006a0014006c001400a0ff5600c0ffe200060024fff60025ffe70026ffdd002affd3002bffec002cfff100210023ffe20024fff60025000f0027ffdd0029ffe2002affe2002bfff6002cfff60034000f0036ffd8003affd80042ffd80044ffd80046fff60047ffba0048ffd80049ff92004aff92004cff920056ffec0057ffe70058ffec005afff6005dfff60062ffec0064ffe70067ffd80068ffd80069ffa6006affa6006cffc400bfffd800c0ffec00170024ffe70025ffe20026ffe20027000a002affe2002cffec0034ffe2003dffd80046ffec0047ffc40049ffba004affc4004bffc4004cffb00056000a0058000a0062000a0069ffe2006affe2006bffd8006cffe200a0ffc400c0000a00210023ffe20024fff60025000f0027ffdd0029ffe2002affe2002bfff6002cfff60034000f0036ffd8003affd80042ffd80044ffd80046fff60047ffba0048ffd80049ff92004aff92004cff920056ffec0057ffe70058ffec005afff6005dfff60062ffec0064ffe70067ffd80068ffd80069ffa6006affa6006cffb000bfffd800c0ffec002e0023ffec0027ffd80028fff60029ffe2002bffec002cfff60034ffba0036ffec003affec003dffdd0042ffec0044ffec0046ffec0047001e004bfff60054ffce0055001e0056ffc40057ffd80058ffc40059fff1005affce0060ffe20061ffe20062ffc40063ffe20064ffd80065ffe20066ffd80067fff60068ffec0069fff6006afff6006bffe2006cffec006dffd80099fff1009ffff100a0ffa600a3fff100b0ffce00bfffec00c0ffc400cffff100d0fff100e6ffe2000f0015fff6001afff6001cfff6001fffe20021ffe20022ffec0032fff6004fffec0050fff60070fff600bbffe200c3fff600c4fff600c5fff600c6fff600120015ffe20018fff6001affe2001dffec001effec0020ffec0022000a004ffff60093ffe7009cffec00c1ffec00c2ffec00c3ffd800c4ffe200c5ffd800c6ffe200d2fff600d5fff600080015fff6001afff6004fffec0093fff600c3fff600c4fff600c5fff600c6fff600070015fff6001afff6004ffff600c3fff100c4fff600c5fff100c6fff6000d0015ffdd0018ffec001affdd001dffec002afff6004fffec0093ffd8009cffec00c3ffd800c4ffdd00c5ffd800c6ffdd00d5ffec000c0015fff6001afff6001dfff6001ffff10021fff10093fff6009cfff600bbfff100c3ffe700c4fff600c5ffe700c6fff600110015ffec0018fff6001affec001dfff6001efff1001ffff60021fff6002ffff1004ffff10093ffec009cfff600bbfff600c3ffe200c4ffec00c5ffe200c6ffec00d5fff600240015000a0016ffec0018000f0019ffe2001a000a001c000a001d0019001effdd001fffba0020ffec0021ffba0022ffce0027ffec002dffe2002effe2002fffe20030fff60032001e0033ffe20050000a0070000a009300140094ffe70096fff6009c001900b9ffec00baffec00bbffba00c1ffec00c2ffec00c4000a00c6000a00cdffec00ceffec00d2ffd800d5000f00160015ffec0018fff1001affec001cffec001dfff6001effec001ffff60021fff6002fffec0032fff6004fffec0050ffec0070ffec0093fff6009cfff600bbfff600c3ffe200c4ffec00c5ffe200c6ffec00d2fff600d5fff10006001fffe20021ffe20022fff1004ffff60093fff100bbffe2000d0024fff6002affe7002cfff10046fff60047ffd80048ffec0049ffc4004affce004cffc40067fff60069ffec006affec006cffec000d0024fff6002affe7002cfff10046fff60047ffd80048ffec0049ffc4004affce004cffc40067fff60069ffec006affec006cffec00010026ffec00020026ffe2002affec00050025ffe20026ffd8002affd8002bffec002cfff1000e0024fff60025fff60026ffec002bfff60034ffe2003dffec0046ffec0049ffdd004affe7004bffdd004cffc9006bfff6006dfff600a0ffce002d0015ff9c001aff9c001dffb0001f000f0020ffe20021000f0032ffec003400190036ffec003affec003d00140042ffec0044ffec0047ffd30048ffe20049ffb0004affba004cffba004d000a004fffba0056fff10057fff10058fff1005afff60062fff10064fff10067ffe70068ffec0069ffce006affce006cffce009affd8009bffd8009cffb000a0000a00bb000f00bfffec00c0fff100c1ffe200c2ffe200c3ff9c00c4ff9c00c5ff9c00c6ff9c00d2ffd800200015fff10019000f001afff10020000f003300140034fff10049ffec004affec004bfff1004cffe7004fffec0050fff60054000a0056000f0057000a0058000f005afff60062000f0064000a0070fff600a0ffec00b9001400ba001400c0000f00c1000f00c2000f00c3fff600c4fff100c5fff600c6fff100cd001400ce001400040054000f0055001400ba000a00ce000a0013001fffd80021ffd80022ffec0034ffe7003dfff10046fff60049ffe7004affe2004bffd8004cffd3004fffec0056000a0058000a0062000a0066000a006bfff600a0ffce00bbffd800c0000a000b003300140054000f0055000f0056000a0057000a0058000a0062000a0064000a00b9000f00c0000a00cd000f00330019ffce001fff920020ffc40021ff920022ffba002dffd8002effd80033ffe20034ffab0036fff1003afff1003dffbf0042fff10044fff10046fff1004bffec0054ffce005500140056ffc40057ffc90058ffc40059fff6005affc40060fff60061fff60062ffc40063fff60064ffc90065fff60066ffd30067fff60068fff6006bffec006dffd80099fff6009ffff600a0ff7e00a3fff600b9ffce00baffe200bbff9200bffff100c0ffc400c1ffc400c2ffc400cdffce00ceffe200cffff600d0fff600d2ffe200e6fff600140015fff1001afff10046fff10049ffec004afff6004bfff6004cffec004ffff10056000f0057000a0058000f0062000f0064000a00660014006bfff100c0000f00c3fff100c4fff100c5fff100c6fff1000e0056fff60057fff60058fff6005afff10062fff60064fff60067fff60068fff10069ffec006affec006cffec00c0fff600c3ffec00c5ffec000e0056fff60057fff60058fff6005afff10062fff60064fff60067fff60068fff10069ffec006affec006cffec00c0fff600c3ffec00c5ffec00290015000a001a000a001c000a001fffdd0021ffdd0022fff6002dfff6002efff60032000f0034ffe2003dffdd0046fff60050000a0054fff1005500140056fff10057fff10058fff1005affec0060fff60061fff60062fff10063fff60064fff10065fff60066fff60067fff10068fff60069fff1006afff1006bffec006cfff1006dfff10070000a0099fff600a0ffd800bbffdd00c0fff100c4000a00c6000a00e6fff6001f0015fff6001afff60020ffc40036ffdd003affdd0042ffdd0044ffdd0046fff10056ffe70057ffe20058ffe7005afff10062ffe70063fff10064ffe20067ffe70068ffe70069ffce006affce006cffce00b9ffe200bfffdd00c0ffe700c1ffc400c2ffc400c3fff100c4fff600c5fff100c6fff600cdffe200d2ffce00230015ffba0019000f001affba001dffbf0032fff1003300140034000f00360014003a0014003d000f00420014004400140046fff60047ffd80048fff10049ffb0004affb0004cffb0004fffd80054000f0056000f0057000a0058000f0062000f0064000a0069ffd8006affd8006cffd8009cffbf00bf001400c0000f00c3ffb000c4ffba00c5ffb000c6ffba000e0056fff60057fff60058fff6005afff10062fff60064fff60067fff60068fff10069ffec006affec006cffec00c0fff600c3ffec00c5ffec000d001fffec0021ffec003dfff60047000a0048000a0049000a004a000a004c000a0055000a005afff6006dfff600a0ffec00bbffec0013001fffd80021ffd80022ffec0034ffe7003dfff10046fff60049ffe7004affe2004bffd8004cffd3004fffec0056000a0058000a0062000a0066000a006bfff600a0ffce00bbffd800c0000a003200140019001500140019fff1001a0014001d001e001fffba0021ffba0022ffec003200140034ffd800360019003a0019003dffce004200190044001900470014004bffec004cfff6005500140056fff10057fff10058fff1005afff1005c000a005d000a0060000a0061000a0062fff10063000a0064fff10065000a0068000a0069000f006a000f006c000f009c001e00a0ffa100b9fff600ba000a00bbffba00bf001900c0fff100c3000f00c4001400c5000f00c6001400cdfff600ce000a00d2000f00e6000a0017001c0014001fffd80022001e002e001e0034ffe7003dfff10046fff60049ffe7004affe2004cffd3004d000f004fffec005000140056000a0058000a005a0014005d001e0062000a0066000a006bfff60070001400bbffd800c0000a002b0015ffdd001affdd001cfff6001dffec0020ffe20032fff60036fff1003afff10042fff10044fff10046ffe70047ffe20048ffe20049ffce004affd3004cffbf004fffec0050fff10056ffe70057ffe70058ffe7005affec0062ffe70064ffe70067fff10068fff10069ffe2006affe2006cffe20070fff1009cffec00a0000a00b9ffec00bffff100c0ffe700c1ffe200c2ffe200c3ffd800c4ffdd00c5ffd800c6ffdd00cdffec00d2ffe200210015fff60019000f001afff6001dfff60020000a0033000a0034fffb0046fff10049fff1004afff1004bfff1004cfff1004fffec0054000a0055000a0056000f0057000a0058000f005afff60062000f0064000a0069fff6006afff6006bfff6006cfff6009cfff600c0000f00c1000a00c2000a00c3ffec00c4fff600c5ffec00c6fff6003000140014001500140019ffec001a0014001c0014001d0019001fffba0020ffc40021ffba0022ffe2002dffd8002effd80032001e0033ffec0034ffd3003dffdd0047000f0048000a004bfff6004f001e0050000a0054ffec005500190056ffe20057ffe20058ffe2005affdd0062ffe20064ffe20066ffec0069000a006a000a006c000a006dfff10070000a009c001900a0ffba00b9ffd800bbffba00c0ffe200c1ffc400c2ffc400c3000a00c4001400c5000a00c6001400cdffd800d2ffe2001e0014000f0015000a001a000a001c0014001d000a001fffd80021ffd80022ffec002dffec002effec003200190034ffe2003dffec0046fff60047000a0048000a0049000a004a000a004c000a0050000a00550014005afff60070000a009c000a00a0ffc900b9fff600bbffd800c4000a00c6000a00cdfff600440019ffce001c000a001d000a001fff920020ffba0021ff920022ffba002dffc4002effc4003200140033ffc40034ffb00036ffe7003affe7003dffc40042ffe70044ffe70046ffe20048000a0049000a004a000a004c000a004dfff60050000a0054ffba005500140056ffb50057ffb50058ffb50059ffec005affb0005cffec005dffec0060ffd80061ffd80062ffb50063ffd80064ffb50065ffd80066ffc40067ffd80068ffd80069ffdd006affdd006bffd3006cffdd006dffce0070000a0099ffec009c000a009fffec00a0ff7e00a3ffec00b9ffba00baffce00bbff9200bfffe700c0ffb500c1ffba00c2ffba00c3fff600c5fff600cdffba00ceffce00cfffec00d0ffec00d2ffc400e6ffd800420019ffd8001c000a001fff920020ffc40021ff920022ffc9002dffce002effce0032000f0033ffc40034ffba0036ffe2003affe2003dffc40042ffe20044ffe20046ffdd0048000a0049000a004a000a004c000a004dfff60050000a0054ffbf005500140056ffba0057ffba0058ffba0059ffe2005affb0005cfff1005dfff10060ffe20061ffe20062ffba0063ffe20064ffba0065ffe20066ffc40067ffdd0068ffe20069ffe2006affe2006bffd8006cffe2006dffce0070000a0099ffe2009fffe200a0ff9200a3ffe200b9ffc400baffd800bbff9200bfffe200c0ffba00c1ffc400c2ffc400c3fff100c5fff100cdffc400ceffd800cfffe200d0ffe200d2ffce00e6ffe200230015ffe70019fff6001affe7001dffe70020ffc40033fff60036ffd8003affd80042ffd80044ffd80046ffec0047fff6004ffff60056ffec0057ffec0058ffec0062ffec0064ffec0067ffe70068ffec0069ffe2006affe2006cffe2009cffe700b9ffce00bfffd800c0ffec00c1ffc400c2ffc400c3ffdd00c4ffe700c5ffdd00c6ffe700cdffce00d2ffba00410019ffce001c000f001fff920020ffb00021ff920022ffc4002dffc4002effc4003200140033ffb50034ffba0036ffd3003affd3003dffdd0042ffd30044ffd30046ffe20048000a0049000a004a000a004c000a0050000f0054ffbf0055001e0056ffb50057ffb50058ffb50059ffdd005affb0005cfff1005dfff10060ffd80061ffd80062ffb50063ffd80064ffb50065ffd80066ffbf0067ffdd0068ffd80069ffd8006affd8006bffce006cffd8006dffce0070000f0099ffdd009fffdd00a0ffa100a3ffdd00b9ff9c00baffba00bbff9200bfffd300c0ffb500c1ffb000c2ffb000c3fff100c5fff100cdff9c00ceffba00cfffdd00d0ffdd00d2ffc400e6ffd8000e0019000f001c000f001d000a0032001400330014003d000a0054000a005500140069fff6006afff6006cfff6009c000a00c3fff600c5fff6001e0023fff60027fff6002a000a002bffec003dfff10046fff60047000a0048000a0049000a004a000a004c000f0055000f0056ffec0057fff60058ffec0059fff6005d001e0062ffec0064fff60068fff60069fff1006afff1006cfff10099fff6009ffff600a0fff600a3fff600c0ffec00cffff600d0fff600160023ffec0029fff6002affec002cfff10036ffec003affec0042ffec0044ffec0047ffe20048ffec0049ffba004affc9004cffc40056fff60058fff6005a001e005d00460062fff60069ffd8006affd800bfffec00c0fff6000e0015ffec001affec001dffec0032fff6004fffc40067fff60069fff6006afff6006cfff6009cffec00c3ffe700c4ffec00c5ffe700c6ffec00140015ffec001affec001cfff1001dfff6001ffff60021fff60032ffec004fffe20050ffec0069fff6006afff6006bfff1006cfff60070ffec009cfff600bbfff600c3ffe200c4ffec00c5ffe200c6ffec00180014000f0015000a0019000a001a000a001d000a0022000a0033000f0036000a003a000a003d000f0042000a0044000a0049ffe7004afff6004cffdd004d000f004fffec009c000a00a0000a00ba000f00bf000a00c4000a00c6000a00ce000f000a0015fff6001afff6001dfff60032fff6004ffff6009cfff600c3fff100c4fff600c5fff100c6fff6000b0015fff1001afff1001dffec0032fff6004fffd8006bfff6009cffec00c3ffec00c4fff100c5ffec00c6fff1001f0014001e0015003c001a003c001c0046001d003c00320041004f003c0050003c0056fffb0058fffb005bfff6005efff6005ffff60060000a0061000a0062fffb0063000a0065000a00690014006a0014006c00140070003c009c003c00b9fff600c0fffb00c3002800c4003c00c5002800c6003c00cdfff600e6000a000f001c000a001d000a0022001e0032fff6004fffec0056fff60058fff60062fff60069000a006a000a006c000a009c000a00b9fff600c0fff600cdfff600110015ffd8001affd8001dffe20032ffec004fffce005afff10067fff10069fff1006afff1006cfff1009cffe200b9fff100c3ffdd00c4ffd800c5ffdd00c6ffd800cdfff1000a0015ffec001affec004fffec0067fff60069fff6006afff600c3ffec00c4ffec00c5ffec00c6ffec000a0015ffec001affec004fffec005d000a0069fff6006afff600c3ffec00c4ffec00c5ffec00c6ffec000e0020ffe2004fffec0056fff10057fff10058fff1005afff10062fff10064fff100b9ffec00c0fff100c1ffe200c2ffe200cdffec00d2ffe7000a0015fff6001afff6001dfff60032fff6004ffff6009cfff600c3fff100c4fff600c5fff100c6fff600110015ffd8001affd8001dffe20032ffec004fffce005afff10067fff10069fff1006afff1006cfff1009cffe200b9fff100c3ffdd00c4ffd800c5ffdd00c6ffd800cdfff100110015ffd8001affd8001dffe20032ffec004fffce005afff10067fff10069fff1006afff1006cfff1009cffe200b9fff100c3ffdd00c4ffd800c5ffdd00c6ffd800cdfff100190015ffe2001affe2001cffec001dffe2001fffec0020000a0021ffec0022fff60032ffe7004fffc40050ffec0069fff6006afff6006bffe7006cfff6006dfffb0070ffec009cffe200bbffec00c1000a00c2000a00c3ffd800c4ffe200c5ffd800c6ffe200140015ffec001affec001cfff1001dfff6001ffff60021fff60032ffec004fffe20050ffec0069fff6006afff6006bfff1006cfff60070ffec009cfff600bbfff600c3ffe200c4ffec00c5ffe200c6ffec000b001c0014002200140032ffec004fffd30050000a005d003c0070000a00b9fff100c3fff100c5fff100cdfff1001e0015000a001a000a001d0014001fffd30021ffd30022ffec002dfff6002efff6004ffff60054fff60056fffb0057fff60058fffb005afff60062fffb0064fff60068000a00690014006a0014006c0014009c001400b9fff100bbffd300c0fffb00c3000a00c4000a00c5000a00c6000a00cdfff100d2fff60009001cfff6001dfff60032fff1004fffce005afff6009cfff600c3fff600c5fff600d2fff600140020fff6004ffff60056fffb0057fff60058fffb0059fff6005afff10062fffb0064fff60067fff60099fff6009ffff600a3fff600b9fff600c0fffb00c1fff600c2fff600cdfff600cffff600d0fff6000c0015ffec001affec001dffe70032ffec004fffd3009cffe700b9fff600c3ffe200c4ffec00c5ffe200c6ffec00cdfff600290015000a0019ffec001a000a001cfff6001d0014001fffa60020ffe20021ffa60022ffd8002dffec002effec0033ffe7004ffff60050fff10056fff60057fff60058fff6005affec005c000f005d000f0062fff60064fff60067000a0068001400690014006a0014006c0014006dfff60070fff1009c001400b9ffdd00bbffa600c0fff600c1ffe200c2ffe200c3000a00c4000a00c5000a00c6000a00cdffdd00d2ffec00290015000a0019ffec001a000a001cfff6001d0014001fffa60020ffe20021ffa60022ffd8002dffec002effec0033ffe7004ffff60050fff10056fff60057fff60058fff6005affec005c000f005d000f0062fff60064fff60067000a0068001400690014006a0014006c0014006dfff60070fff1009c001400b9ffdd00bbffa600c0fff600c1ffe200c2ffe200c3000a00c4000a00c5000a00c6000a00cdffdd00d2ffec000f0020ffd80033fff6004fffe20056ffe70057fff10058ffe7005afff60062ffe70064fff100b9ffd800c0ffe700c1ffd800c2ffd800cdffd800d2ffe200290015000a0019ffec001a000a001cfff6001d0014001fffa60020ffe20021ffa60022ffd8002dffec002effec0033ffe7004ffff60050fff10056fff60057fff60058fff6005affec005c000f005d000f0062fff60064fff60067000a0068001400690014006a0014006c0014006dfff60070fff1009c001400b9ffdd00bbffa600c0fff600c1ffe200c2ffe200c3000a00c4000a00c5000a00c6000a00cdffdd00d2ffec000a0032fff6004fffd80056fffb0058fffb005afff10062fffb006dfff600b9fff600c0fffb00cdfff6001e0023fff60027fff6002a000a002bffec003dfff10046fff60047000a0048000a0049000a004a000a004c000f0055000f0056ffec0057fff60058ffec0059fff6005d001e0062ffec0064fff60068fff60069fff1006afff1006cfff10099fff6009ffff600a0fff600a3fff600c0ffec00cffff600d0fff600050024000f0027ffba0029ffec002a0014002bfff600060023fff60025000f0027ffec0029fff6002bfff6002cfff60002002afff6002cfff6001c0015ffd8001affd8001cfff1001dffe20032ffec004fffd80050ffec005affec005dfff10060fff60061fff60063fff60065fff60067ffec0068ffec0069ffd8006affd8006bffec006cffdd006dfff60070ffec009cffe200c3ffce00c4ffd800c5ffce00c6ffd800d2ffec00e6fff6000b0025fff10026ffe7002bfff60034ffd8003dffec0046fff60049ffdd004affe2004bffce004cffc400a0ffbf000b0025fff10026ffe7002bfff60034ffd8003dffec0046fff60049ffdd004affe2004bffce004cffc400a0ffbf001f0014001e0015003c001a003c001c0046001d003c00320041004f003c0050003c0056fffb0058fffb005bfff6005efff6005ffff60060000a0061000a0062fffb0063000a0065000a00690014006a0014006c00140070003c009c003c00b9fff600c0fffb00c3002800c4003c00c5002800c6003c00cdfff600e6000a00030033001400b9000f00cd000f000a0015fff6001afff6001dfff60032fff6004ffff6009cfff600c3fff100c4fff600c5fff100c6fff600020024000a002a0014000a0015fff1001afff1001dffec0032fff6004fffd8009cffec00c3ffec00c4fff100c5ffec00c6fff100280023fff60026fff10027fff60029ffec002affec002bffec002cffec0036ffec003affec0042ffec0044ffec0046ffe20047ffec0048ffe20049ffce004affd3004bffec004cffc90054fff60056ffe70057fff60058ffe70059fff6005d00230062ffe70064fff60066fffb0067fff10068fff60069ffec006affec006cfff60099fff6009ffff600a3fff600b0fff600bfffec00c0ffe700cffff600d0fff600080046fff60048fff60049ffe7004affec004cffe7005d00140069fff6006afff600020027ffe2002a00280007002afff6002cfff60046fff60049ffce004affd8004cffba00a0fff600120025fff60026fff1002affe2002cffe7003dffec0046fff10047ffd80048fff60049ffba004affc4004bffce004cff9c0069ffdd006affdd006bffd8006cffdd006dfff600a0ffe200210023ffe20024fff60025000f0027ffdd0029ffe2002affe2002bfff6002cfff60034000f0036ffd8003affd80042ffd80044ffd80046fff60047ffba0048ffd80049ff92004aff92004cff920056ffec0057ffe70058ffec005afff6005dfff60062ffec0064ffe70067ffd80068ffd80069ffa6006affa6006cffb000bfffd800c0ffec00030033001400b9000f00cd000f000a0015fff1001afff1001dffec0032fff6004fffd8009cffec00c3ffec00c4fff100c5ffec00c6fff100170024ffe70025ffe20026ffe20027000a002affe2002cffec0034ffe2003dffd80046ffec0047ffc40049ffba004affc4004bffc4004cffb00056000a0058000a0062000a0069ffe2006affe2006bffd8006cffe200a0ffc400c0000a00170024ffe70025ffe20026ffe20027000a002affe2002cffec0034ffe2003dffd80046ffec0047ffc40049ffba004affc4004bffc4004cffb00056000a0058000a0062000a0069ffe2006affe2006bffd8006cffe200a0ffc400c0000a00260023fff10026fff60027ffc90029fff1002a000a002bffe70034ff8d0036fff6003afff6003dffba0042fff60044fff60046fff1004700140048000a004bfff60054fff10055000f0056ffd30057ffdd0058ffd30059fff6005affd80062ffd30064ffdd0066fff10069000a006a000a006dffec0099fff6009ffff600a0ff4c00a3fff600b0fff100bffff600c0ffd300cffff600d0fff6002e0023ffdd0026ffec0027ffa60028ffec0029ffd8002bffd8002cfff60034ff7e0036ffdd003affdd003dffb50042ffdd0044ffdd0046ffe20047000a004bfff60054ffdd0055000f0056ffb00057ffc40058ffb00059ffe2005affba0060ffec0061ffec0062ffb00063ffec0064ffc40065ffec0066ffce0067fff10069fff1006afff1006bffec006cffec006dffd80099ffe2009fffe200a0ff4200a3ffe200b0ffdd00bfffdd00c0ffb000cfffe200d0ffe200e6ffec00260023fff10026fff60027ffc90029fff1002a000a002bffe70034ff8d0036fff6003afff6003dffba0042fff60044fff60046fff1004700140048000a004bfff60054fff10055000f0056ffd30057ffdd0058ffd30059fff6005affd80062ffd30064ffdd0066fff10069000a006a000a006dffec0099fff6009ffff600a0ff4c00a3fff600b0fff100bffff600c0ffd300cffff600d0fff6002e0023ffdd0026ffec0027ffa60028ffec0029ffd8002bffd8002cfff60034ff7e0036ffdd003affdd003dffb50042ffdd0044ffdd0046ffe20047000a004bfff60054ffdd0055000f0056ffb00057ffc40058ffb00059ffe2005affba0060ffec0061ffec0062ffb00063ffec0064ffc40065ffec0066ffce0067fff10069fff1006afff1006bffec006cffec006dffd80099ffe2009fffe200a0ff4200a3ffe200b0ffdd00bfffdd00c0ffb000cfffe200d0ffe200e6ffec00020023fff60027ffec0007002afff6002cfff60046fff60049ffce004affd8004cffba00a0fff600120025fff60026fff1002affe2002cffe7003dffec0046fff10047ffd80048fff60049ffba004affc4004bffce004cff9c0069ffdd006affdd006bffd8006cffdd006dfff600a0ffe2000a0015fff6001afff6001dfff60032fff6004ffff6009cfff600c3fff100c4fff600c5fff100c6fff600140024ffec0025ffec0026ffec002affd8002bfff6002cfff60034ffd8003dffd80046ffec0047ffe20049ffc4004affce004bffba004cffc4004dfff60069ffec006affec006bffe2006cffec00a0ffa600210023ffe20024fff60025000f0027ffdd0029ffe2002affe2002bfff6002cfff60034000f0036ffd8003affd80042ffd80044ffd80046fff60047ffba0048ffd80049ff92004aff92004cff920056ffec0057ffe70058ffec005afff6005dfff60062ffec0064ffe70067ffd80068ffd80069ffa6006affa6006cffc400bfffd800c0ffec00210023ffe20024fff60025000f0027ffdd0029ffe2002affe2002bfff6002cfff60034000f0036ffd8003affd80042ffd80044ffd80046fff60047ffba0048ffd80049ff92004aff92004cff920056ffec0057ffe70058ffec005afff6005dfff60062ffec0064ffe70067ffd80068ffd80069ffa6006affa6006cffc400bfffd800c0ffec000200130015001600000019001b0002001d003100050033004f001a0054006e00370093009300520095009600530099009b0055009f00a0005800a300a3005a00a600a6005b00b000b0005c00b200b3005d00b600b6005f00b900bb006000bf00c6006300cc00ce006b00d000d0006e00d200d4006f00010000000a0022004800016c61746e0008000400000000ffff000300000001000200036c69676100146f6e756d001a7469746c0020000000010001000000010002000000010000000300080010001800010000000100180004000000010064000100000001009200020090002700f500f600f700f800f900fa00fb00fc00fd00fe00ff0100010101020103010401050106010701080109010a010b010c010d010e010f0110011101120113011401150116011701180119011a011b00010058000100080005000c0014001c0022002800a200030059005c00a300030059005f009f0002005900cf0002005c00d00002005f0001002800f9000200040023002c00000034004d000a00c300c3002400c500c60025000100010059000200010023002c0000010004020001010113444533446973706c6179456779707469616e0001010134f81000f84f01f85002f85003f85104fb190c039f0c04fb3efb691c05a5fa31051d0022d4680d1c10050f1c116511b61c3901120037020001000a00160021002a00330039003d004c005c006000670070007a00860091009c00a900b500c100cc00d900e600f200fb0104010d0116011f01280131013a0143014c0155015e0167017001790182018b0194019d01a601af01b801c101ca01d301dc01f002010213025d027102776c657373657175616c67726561746572657175616c7768697465636972636c65626c61636b73746172776869746573746172696e636865736665657471756f746563617064626c6c65667471756f746563617064626c72696768744575726f6e6273706163656172726f776c6566746172726f7772696768747a65726f2e7469746c696e676f6e652e7469746c696e6774776f2e7469746c696e6774687265652e7469746c696e67666f75722e7469746c696e67666976652e7469746c696e677369782e7469746c696e67736576656e2e7469746c696e6765696768742e7469746c696e676e696e652e7469746c696e67412e7469746c696e67422e7469746c696e67432e7469746c696e67442e7469746c696e67452e7469746c696e67462e7469746c696e67472e7469746c696e67482e7469746c696e67492e7469746c696e674a2e7469746c696e674b2e7469746c696e674c2e7469746c696e674d2e7469746c696e674e2e7469746c696e674f2e7469746c696e67502e7469746c696e67512e7469746c696e67522e7469746c696e67532e7469746c696e67542e7469746c696e67552e7469746c696e67562e7469746c696e67572e7469746c696e67582e7469746c696e67592e7469746c696e675a2e7469746c696e6771756f746564626c6c6566742e7469746c696e6771756f74656c6566742e7469746c696e6771756f746572696768742e7469746c696e67436f70797269676874202863292043687269737469616e20536368776172747a2026205061756c204261726e65732c20323030352e20416c6c207269676874732072657365727665642e44453320446973706c617920456779707469616e4e6f726d616c009a0200010018004e0053008900c600dc00df00e400e90108011101270139019701b601e501fe020a024b0252025d029002a10304030f0321037803c703d00423042d0434044a0457046904aa04c5050a0517051e0532057205b305f305fe0632063e064b0659067e068e06aa06b006be06cd06e206e906f50728075d0792079707a907da080d081808480856085d0866086e08720878087f08880891089708bd08ce08ec08fb0903090b091109150932093c094b0951096c09750984098b098f099d09b409b909c209cc09d909e009f609ff0a060a0a0a1d0a210a2c0a3e0a420a480a550a5c0a660a740a7d0a860a8d0a910a970a9c0aa00aad0ab50aba0abe0aca0ad30adf0ae50aeb0aef0afa0b010b060b0a0b140b1e0b280b320b3c0b460b4a0b540b580b610b680b710b7a0b7e0b820b870b8c0b912c1df73a16a9a3a5a7a973a36d6d72736d6fa471a91f0ef76fb4063b9ec2f73805f77d06c0fb383ca31df794b507469dfb6bf90d053906fb72fd0d467905f7ccf8a3159006e9fbba05fb5b060bf7e8200a0b7e15f736e8e5f7231ff83207d78e0afb7d61970afc2807fb104e559c1d4ec1f70f1ef82a07e3720ae17905fc3b07fb1be032f73f1e0bf7768115d2c4a2b1b51f91535c0af857078091fb2ea60ad47b05fc01077e6d6a7b4c1b3b78aed31ff7f3078091fb30a60ad77b05fbca072fb651f21e0bf7a47e156a0af73527f3fb27fb1afb02611d1f311d0b15201d9f16230a0beb03251d0b15fb2e55f712f74df73ccbf711f721f720d0fb02fb5efb3c49fb10fb201f0b7701e8f0f7e9250a0b15f709d5f70941a0a8fb07f70d055d06fb07fb0d050eaaa3a5a7a973a36c6e72736d6fa471a81f0b7f15f740d1f0f700f70642b534b01f37ae0545a869abc71ad0c3acd1c9aa7b819e1ea63205ba0684f72805986456973c1bfb2845372827c158d86b1fdf6705da6aba6d421a495b532e5166979f661e6bf17d0a92fb320578bccc7cdc1b0b34cc56e61eacc9154a6daec0bea1aad1911ff19305fb27077a786477621b0b359e05f78907f74ff7dcc7890afb5e6207d578fb26fba1910afb35f7a1d0890afb826207c878f75cfbda05fb8b070be0bf6a1d637d421b214bcff71d871ff7f106f7354ff3fb290b8cc2651dd3bdd6d7d75e0a0bedcb99a0bd1f91f7427d0a62fb10057b6e657f5b1bfb3848f702f75ff74bd3f700f729bbbb7d80a41fb4fb0605b90686f73d0599604b97371bfb41fb3a30fba80b6b1df763280a0bf77cfb1ff710fb40590a0bf78cb306329f05f8b88f07f7f8fcf405daf90d06da9f05b3fb806207e37705fc5b8607fbc2f89805fb726206e4b51d3277050b981d349d05f8d307e29d05b4fba7581d0b01b1daf75ade03f7557e15f718ced2e2d369b52eaa1f549d0541a272a0b71ac0b59ec2b4a384819c1ea33d05b8f7160695695894521bfb0f4d473b3fb861db711fc27905d274a57a571a565d724c5d699795781e70e47d0a93fb1e057cb8c67ec21b0b159fadfb40f7145e43050ec506accb9dcd97d6082606418249804a1e0b7e15f72be3f0f715f71830d7fb083e4c6f705f1ff76b9cf0c4f7041bbcba837fa81fbc079f6c5d994d1bfb36fb3020fbb2fb60ebfb0df7321f8ac215fb0b6af70df7211f9b07a4b2ba9bcc1bdbc760fb02275f492c1f0ef7ca06f73bdedcf3f05cc3fb119d1f900713f8ed9db1d3cf1af7083cc1fb351efbaf871d980af7519a15f7a9f7020713f4f0c06524285566231f21f7dc15f791e20713f8e5be75fb032e50703b1f0ef27d1df75c77290a0b7e15d9cf969fc41ff78307d59c05b4fb9e6207e77a05fb5607827069825a1bfb3948f702f75ff74bd8f700f72cc3b5807ba91fb5fb0505b90683f73f0598604a97311bfb41fb4030fba8fb8ff71627f76b1f0e410a13dc640a13ec4e1d940af77c2a1d0be7d6cff710f7103ccd34323d47fb12fb0ed549e71f0b7f15321dfb8ff71728f7541f0ef006d594cd96cc1e51066a4b79497f40080bf780b4063d9e05f8c58e07f75bfcdf05c806f762f8df058efcc5063fa31df7a2b4072b9e05f8d207eb8e0afb8707fb41fc90910afb3ef89005fb7e6206671d9d0a15506fa5b9b3a5a5ae9d1fd670b17b5d1a6170724f1ea2f766150bf773b3063f9ff728f786f72bfb8742790562f796b407419dfb53f7c0f73df7a7d68e0afb746207d779fb16fb72fb15f772d28e0afb9b6207d679f745fbadfb51fbb9419d0a06a62b05b6f7866006702c050ba076f949320a0ef80d7007fb095c056a07ce9105fbc3074e81050b16dc06f729f89e058f06f724fc9e05dc06f73ef90dd1890afb6d6207d678fb0ffc7a910afb2ef8b6054e06fb2dfcb6058606fb12f87ad6890afb7f6207c79d0af8520697f744055d065e2c05fba08d06f708f105f71ff70edcebf41af71a34cafb154543706f5b1e5b079cb9b89ac41bf704b8573727473b2d2c1ffb40fb42050e7e15f730f70cf706f78bf78efb11f6fb2afb2cfb12fb04fb90fb89f70bfb01f7321fc204fb0d54f700f75af75ac3f3f70df70cc1fb02fb5bfb60542cfb0c1f0e06b6fb0905bb0680b01d0bf7abb406309d05f8d307e68e0afbab581df8636215f72fb406409efb75f7c9f775f79dce8e0afb6b6207cb79fb7bfbb00575070e6f66ad601b606c6950731f0e0744720568d2fc2807417b050b7a1d95b51bd2af77531db8811d0bf7b9b406229e05f8d2eb07ebb664262c5c56700ac6f722f70b48d4fb581ffb9c871d339d0a9f540af7a716520afc1efbef15520a0e451ffbcc07427b0569f7846c0af7e407f05aaf2c4d4f736e591e850b15d006550a0b15f70392babddb1bd5b05c211f0b9f540af86916571d7bfbdc15571d0ed306fb45f7eef745f7ef054306fb5dfbde0568070b6207671d79050b8bc2f7a9bef71e77f71dc20bf7b1b4062b9e05f797f71a07a42905b7f7876006712d05fb1af7a0f78b06b6fb0f05bb0680f74605fc976206e3b51d3279050efb4bfb1d25fb30fb33f70532f741f71ce6c1f0c21f92fb51fb37fb18fbac7c087107f7bb90f797f2f7a81af75dfb20f714fb761e0bf74bf71df1f730f733fb05e4fb41fb1c305526541f84f751f737f718f7ac9a08a507fbbb86fb9724fba81afb5df720fb14f7761e0bf891681d0baba4a6a8aa72a46b6c71726c6ea570aa1f0e16f7afb406309d05f8d7f72b0713d0b1fb2305bb0680f75a05fcbd0680fb5a05bb0613b0b1f72305f72bfcd7063079050e7701f7346815f797f74ef796fb4c938f27f7c3f793f74a0593fbd20728f7c505830628fbc505fbd28306f793fb4a27fbc5050bfb01fb35fb35ee22f7280b01a616f8200698f7407d0a66fb0e05fb6c8f06f7bff83105b9fc110783fb3505ba06a9f70305f7608706fbbffc2f050b15ebc5b9d5ce5da957941f8d070b8c0af77c360a0b153e40c3f736f7320b850afb3316421d0e6c1d330b76f76177010b8b1db807620a0ea79eab1fb8077e660b217ec96576f864d00b880afcd3070bf82a7b15f761f73df73cf761f761fb3df73afb61fb61fb3afb3afb61fb61f73afb3cf7611f0bf88d06831df8d706eb9d05b4fbb0581d0e33810ac007ebb1a5cdaca087879e1eb80796786e97571b2f3e5bfb141f0ba71d3af75adc971d21fb4b056e070b5174c0e7660a1f0b07e29e8d1d78050b7805fcd1070b0565070b16f7c6b406249c05f9187107fb4f44056207f7059605fcb307247a050e357fccf761c1f731c10b9aba1beac359fb24fb384a562e1f0ef701c3f7010b16f70206f7a4f90205d2fc520782fb3205ba06a8d705f7d587060e821df80f0798b1b10bdcbda2a2ac1fb9077f735e7d461b0b657ec2f83ec20b7f881d0b0671fbea0590a9b693b21bf70c0b840af947077f91556b059a685a9d521b2f305efb0c1f0bfc015d1d0b068091fb2b73741d0b9916f784ad06429b050b98f76f055c065afb3805fb7e0b12a1e9f756e70bd7c9b94df78e4b07fb5bfb930562f7503f075481050beb8e0afbb062970a0b6206e379a61d0bc49d1d0b23a71daccb9dcc95d70823063c854e804a1e0b15391d0be3afa5c5aa9b88889a1e0bada8a8abae6ea669687070686ba66eae1f0b610ae30ba076f85ac60bfc01820a01ddc903d79c0ac90bc759c712b60a0bfb2c656d8686751f9a0b7a7ca11ffbf2077f74607a5c1b0eb70613e8f706c0670bf7ac77a97712f6d80bd776f81f77010b468b0a0bf759054f060bf7a7b4060b038b040ba076f7d3bef72577f723c2010bbdf72bb6f71dbc0bfb02fb010bf8f0c30b728bc2f9127701f706ef030b8e1df743c701efe70b15f715f7134aba2afb2e050b7ec2f8f4c20b7b05fc1d070b7805620bc5f7c915f82ec9fc2e060b12f762d74cdb0b05fcd2070b15c7060bc201f707eff7dcf6030ba076f89e77f75377010ba076f7ddbef7cd77010ba076f7c0b9f7b4c6010bfba0fb0d76fa0c77010b80ccf7cacdf748de010b1bb21d0b7ec2f7d3cbf76dca010bf740050baca4a5abaa72a66a0bfb1a9c1dfb350b30f8e176f73677010b16f74cad065595050b78a61d0b12b80a0bf70628e70bc5f8eec50bf78c7f150b01000100009a0000a700008c0000920000c00000dd0000c50000e200009d0000a20000c70000e40000960000a90000a40000a00000a60000a800000205006800000937007c0000421d00ad0000af0000b10100ba0000bd0000c30000c80000cb0000c90100cd0000cc0000ce0100d20000d00100d30000d60000d40100d70100db0000d90100dc0000de0000e10000df0100700000a10000610100660000740000730000950000a50000aa00009900007d00008300010a00008a00008d00010b01018701006400018904009b00018e01009e00009000009300007b0000600000a300014400006500014001006a0000780100ae0000b00000bf00008e00009400006f00008900006900007700004100000800009f0001420000e30000c600006300019000006b03014500007200007501007a0000ac0000b30000ab0000b40500bb0101430000be0000c10100c400009100007e0400840400670001912900ef09012602000100030006004800a400d200ff010d011e012a013c018101b901ca01db01ec020502150223022b0260028c02a002e2037d039c04360442047504a504df050705100521052d053f054d055c056b057905840591059e05a805b305c005da05fd06190635065306b907760781078c079607a107b007bb07cb07da07e307f307fe080408130823082c083a084b08590860086c0874087b0883088a088d089608b408c708e709090919092109320976098f09da09df09f00aaa0ad60aed0b260b730b880c000c140c190c440c8f0ccc0cd60d170d1f0d4c0d930de50df00df90e620e690ecf0f0b0f1c0f310f530f5b0f740f870f990fa00fa80fb30fd40ff5101c10401048104f105c10761081108d109810b310da10e110e810f51107111a11261133113f115a119511ce12351292133f134a137c13fd146214b91545154d155d157715cf164a16a616cb16cd16cf172f1763176c179c17ab17b317dd17f91817184c18e2195519be19ea1a281a531ab21aed1b2f1b3e1b4e1b6b1b731b891b9e1be81c341c3f1c491c4f1c571c5d1c651c851cfe1d141d3a1d481d4a1d541d5d1da11dba1df61e041e0e1e181e461e511e5f1e661e801e881e8f1e9a1ec91ed11ed81ee61f391f401f471f531f5a1f611f6f1f921fa31fd31fe51ff9200d2021205820662068206b206d206f207d208c209a20a820b320c020cd20d720e220ef20f92103210d211d212721302140214d215821682171217e218b219921a721b321c521d121e121ed21fd2205220d22142217222022282232223c228222ab22f6235a239123d62440246324e1254c360efc190ee78bc2f79cc6f798a81da7f7d315dcfb970632a31df7b407f77df2f716f77ef7662af70bfb8e1ffba86206e37805fb933a07f749fbd715f79cf747c6fb47f798730a7c1df7797701b80aeb03f726f8bd15f71bc7b763b15aa64f19b5655d9c5c1bfb1421611df71af702f1f75bf7354bf70526dd1fdfb105c107fb165161a75ca358a1197464ac78ac75aa73192e6205f713fcc9651dcfbdd6d7db5e0a0e9e1da7f77015dbac05fb560733790562f88d07831df78406f75ce005c907fb5c3605f7a907861dfbd3073b6a050ea076f97f8d0af78f04e4be05fb9007407b0569f7866c0af7c507edc305c907295305f7d89a0afbc6073258050e4f7fb81df74c77350a7ff984470afb357ec2f83ec1f75577371d84f8d6470aa84c0af77c320ac2f952330a56fb5bc9f91e77f78177012e0acaf993330a76a076f747b9f7a0c650f75c12f706eff77ff313ec9f16f7b9b406229e05f845ef07ebb2642e345c5a700ac5f717f7014cd6fb4e1f31dc06e29e0513dc7c0ae3731d339d0a73a80af772771290f73635e135e6f79de913f98c6d0af7a5067f90fb2a9b0a13f5d77b05fdc7af0a13f34f729c99751ff7f70795a2b7771d5ab50af759770196163a0af77bf94a470a208bbdf831bdf75e77621df74ef899470afbc8f7c376f8397701f6d803b3f7ae760afb8ff7a79b1da51d13e8f71ff7a7631d13f02f0a13e83e0a0efb8ff7aec4f7cbc201f76cdb03500a0e8f1df8234d06e704c9f7fe4d060e56f7c9c901a41d0e56f73c76f8157701f707f72715f728f728f729fb28b7b7fb29f728f728f7285fb7fb28fb28fb28f7295f5ff728fb29fb28fb28050efbde7ef708f8e27712d3f70926db13d0eaf75215c206a4f88b052206c1fd561513e0aca5a6aaab71a56aa00a800ad2f3c2f303f760f87c15790afb3316790a0e40a076f764e3f704e3f7597701cbf82c15db0679fb04052e33da9f0af7089f0aeae33a069df70405e9e33b9e0afb089e0a2d06f7203315f7080679fb0405fb08060e3f2b76f4b81dc67701bcdcf79ae103f742fb0915c60696f405f73790ccedf51af7063db439ae1e7196a5f789a3869a85978719a63205ba0684f71b7194699857911992ca055006855005fb2846372827c55bd66b1fb7786efba76e9074937497196bf27d0a92fb2fb17cb97ec58719f75df746154b5e5430881ea5f79205d46ab06b481afb9af80d15cfc3aed31e8d0673fb760547a865acc81a0ef78b7e0a13f7805b0afc866f15d00613ef80780afc4bb30a13f780660a1e0eee7fc77076f91dc312a7f18ae6f734e513b4b91ddbcda8b9bf1f136cc04c05f72eb406379e4fd3b2c2a6cb99c719d09f05b3fb696207da77815d7a5c726219fb42f76405e5bbd7b9e51ae340bc372838492051a45db05b1e13b429534a532e1afb04e740f71a1ea0c7153055c7d9cfaab9c8b41ff758fb810569645c75521b13ac54f88415cbadb4bfb8a86d5446686944631e6bb375aebb1a0e801dd2f303b8f87c15790a0eac1db7ef03f79efb2215aba90535ea41f716f7651af732d5f721e1ea1e6ba9052536fb12fb2afb651afb79f712fb16f1361e0eac1df747ef03b8fb2215f1e0f712f72af7651af779fb12f71625e01e6b6d05e12cd5fb16fb651afb3241fb21352c1e0efb6bf83376f7bf7701f724f81e15d60678f707e943afc6fb04b9f704ba67c62d429ef70a0540069efb0a2ed46750f7045cfb045daf50e8d3050e56f72b76f747c9f7477701f780cd03c5f7c915f740fb47cdf747f740c9fb40f74749fb47fb40060efbfa38681dbb891d0efba9f78cd901b4f78c15f770d9fb70060efbfa7ca40a03f7017c8a0a0efb89820a018f9c0acc06f784f9e9054a060ebaa11d01b5f0f7f3f003f7cd4b1dfb5da076f9527701f72cef03b6751d4a8bdcf8bdd201f7f3f00396164a1d35ad0af7e4ec42f013e8f76a3b0a82ab0af7e6eb03f7825d0a40ad1ddfc7f76ef203f75c490a7caf1db7f1f7b6f003f7b83a1d30a076f8f7dd01e7791d7da11d12b3a30af7b0340a7cae0ab2f0f7b5f203f75c390afbf37cf712f73ef71201c3f71403f706f7ad8a0afbbc04380a0efbf33876f761f7488bf71212c3f71413d0ba891dcef81515aea8a6af1f13b0460a1e0eb20af847f71f15d207fbbaf716f7baf71505d207fc0afb430558070e4cf756c9f700c901c8f80015f81ec9fc1e06fb7c04f81ec9fc1e060eb20ad2f71f15f80af74305be07fc0af743054407f7bafb16fbbafb15050efb3f7ef708f8afca12f701f70924c5f5ea13d8f71cf75015bc0684ab88a19d1a8cbbae9cb4a608dec1b4b2e01af71632b8234b5d7e745a1e5b0799b8a892c31bd3c26b3951766f5d671f4c5a6971501a67966e93781ea4fb5d1513e8aba6a6aaab70a56ba00af7c7fb2fbff714c05ec5f7e9bff726bd12bbcdf719e9f856cb13dff851fb2f15e6db9ca6c71fb807754c397c351bfb75fb04f5f765f777f71cf753f786f758f2fb06fb52fb2843272971829cb4931fcef7e7055d067270059d6e739d501bfb2232fb24fb2e1f13bf24c859cebcb0a0afaf1e910613df6693ab6fcb1bf722f5f717f741f770fb23f717fb6efba1fb45fb6efb8ffb7af722fb1cf7991f13bf63f78a155c74a7cef70eb4f710eab5a17973961f5bfb950576736c76651b0ed3a076f774bef8362d0a0ea5ac0af707b00a9f163b1da3a50aadf503f7f3411de78bc2f8dba81d9f165a0a918bc2f7a9bef71e77f71dc22b0a0e8c9a1df707ef039f165a1ddb7ec59d1d01adf5f7eaef03f8093d1df725aa1df706eff7caef039f164a0afb9ca076f949360a0efb4481cbf9137701f76aef03f712630ad3540af706ef039f164d1d9e1d9f166e1df7b1540af706d1f86ced039f16431df714540af707d1f806d0039f16351d0ef27fc4f8f0c3290a0e71ab1df706eff77ff3039f16511df22076f99dc301adf5f832f503f92a400ac4aa0af708eff784f2039f16420a4f7fb81d350a0e99a90af790f013b0f72f5f1deb7ecbf9162a1d0eca540af7ae670af7f9a91df77d491de7540a9f16451da8471d5ab50a0196163a0a0efb9d820a01d1e503cb9c0af76db406fb139d05f97307f7138e0afb6d070efb89820a01f79d9c0acc06fb84f9e9054a060efb9d820a01f73ae503ac9c0af76df9e9fb6d6206f7137905fd7307fb1379050efb4df86e76f7847701a1f85915c106f70df731f70dfb3105c106fb26f7840551060efba1fb0cbf01819c0af7debffbde060eb31df7d8f8cc381d6b1d841d13b84f0a1378210a13b82e1d0e657fc0f82fd2f7727701cfe6f79cea03b91df732f5edf752f75a25930a86f7a5067f90fb2a9b0ad77b05fd170779b6cb78da1b96c0154f739c99751ff7f70795a2b6771dfb137fcdf832c201aaea03f7a57f155f0afb35e424f7331f0e867fd1f82fc1f7727701afe9f79ce703f78b7f15cfb9a4ada61f91575c0af939077f90fb369b0add7b05fb3307936f7091631bfb322232fb52fb5af70d51eb1fa7d1b10accbce8c7a3921d761d2a0a0efba09f1d039f16f792ad066f1d514f1d0e3cfb62c4f743e1d6bef77ebe8e771299e259e6f767e66adc13f480f76dfb6215f744e8e3f3ed43a7391ffb3f06717f999c9c94a19e9d1f82a6aa87ab1b13ed00f700e4c7f705ba7baa71a51fea8505cf07fb2a760513f300976e6991671bfb00324efb054ba760b7711f61687468651a6aa173ab7f1e860713f48053736162571a52c549f72b1e93c4152f65aebcb39faeae9b1ff73b06c4aa795c515557fb121f9bf8171513f3004f5eaeded8b5b2cac7b968383d60654c1f0e8ca076f859d1f77577900a13f47a1d96b51bd2af76531df7a4068091fb2b9b0a13ecd67b05fd010713f4a20aa076f8f1f70412dbb71d13d0300af708f8cf1513e05e1dfbd2fb59c1f980f70412e1b71d13d0adfb5915edc2bee51ff8cf4e0afc7d073c62795a7e798c8d7d1e610782a3a485a41bf2f9b61513e05e1d59a10af79277830a13f09916f788ad063e9a05f948077f91fb2f9b0a13e8d67b05fd010713f0407c05f80f6915f71cad064a9bfb3ff78af721f73ad49a05affb5e6707c77cfb2bfb53057d070ea076f97f8d0a9916f786870af9479a0afd0007a20af7bfa076f859d1830af76be6f76be713ec821df8100798b1a795ba1bcdaf74411ffbc607417b0569f782ad07429b05f7df07a2899a89961e97aeb196b21bd2af74411ffbc607427b0569f783ad07419b05f7df07ed5bb730474e716c5a1e8506b276649d501b445b756d581f85b7811d13dc950a13eca20a8ea076f858d2900a13e8501d13d8950a13e8a20a7c1d2c0a0e7da80a01e6e7f79ce903966d0abb068091fb2a73741dd67b05fce6af0a4f739b98751ff7f90795a2b6771d70fb4676f74fd1f82fc101afe9f79ce703f7c1fb5b15f791ad06419905f917079f514b96461bfb2d212cfb51fb5bf70457ebcfb2a5a9b11f91fb5506337b0571f773b10acdbce3cca2921dfb79a076f84edc830a13e09916f78dad06399b05f7f907a1acb498bb1b949c8a89981fdb078d867d8d821b535c65686e1f85cc811d13d0950a13e0a20afb357ec2f83ec1371d0efb8182c7f827c6f70c7701e7e703f76d8215b6b39a9aa11fb00787777588751b4c7aa5c41ff7d4f71ac6fb1af70c46077bfb0c3b730568d4fbe7072eb76ce21e0e8e81cdf864270a0e59a10a01f77916d406f741f862c39a05affb476707ca7ffb15fbff910afb13f7ffca9705affb706707c37c050ef756a10a01f75516cf06f714f813058e06f70bfc1305cf06f723f862c09a05affb486707ca7c29fbe5910afb11f818055006fb11fc18910a27f7e5cb9a05affb656707c07c050e59a10a019416f752ad064b98f703f73a058d06f702fb3a4c7e0569f775ad074e9afb25f76df71df758c59a05affb4e6707ca7e24fb3605890622f736c69805affb726707c67cf721fb65fb23fb604e7c050e56fb5bc9f91e77012e0a0e208bbdf831bd621d0efb67820a12f70eea4be313e0f7e39c0ab4072e9a6c95c51a13d0baa3d3c61abd81b7fb18a71e9007f718a795b7bd1a13e0c673d3ba1ac5aa95e89a1eb407fb41865d58411a13d053aa325f1a657f72207e1e4c07f67f9771651a13e05f6c32531a41b958f741861e0e8f1df9e94d060efb67820a12f71fe34bea13d0ac9c0af74190b9bed51a13e0c36ce4b71ab197a4f6981eca0720977fa5b11a13d0b7aae4c31ad55dbefb41901e6207e87caa81511a13e05c7343501a59955ff7186f1e8607fb186f815f591a13d050a3435c1a516c812e7c1e0efb47f788d44e76c3d49477121360c8f77f15b4a3a09aa41b1390aeb75cc11bc0acadd7a91f629e056273767c721b1360685fba551b566a693f6d1f0e6e0ad5b90af74d781d03220aa3f86c261d6e0ad6b2eeb201f779b7edb703220af6f86d15450aa32eb8af881d01adf5f735f73303f7a6750aaf9507321dfb76f524f735791f377f0a3d0af753f952330af7144c0af3b70af707d1f806d013ec9f16351df773f96f3e1df27d1db5b90aadf5d1781dd1240a37f952261d940ad5b90ae8f097781dc2250a32f98c261d331d5af89b330a331df703f89b381d6b1df752280a35f8962b1d6b1dbcf70012a1e980781d46e713ba4f0a1379210a13b92e1d57f89f1513b6201d6b1ddaf39277841d13b64f0a1376210a13b62e1d3cf8b6410a13ae640a13b64e1d6b1dbdb2eeb212a1e9acb7edb772e713bf004f0a137e80210a13be802e1daaf8a01513bf00450afb132eb8afcdf832c201aaeae8f73303f754750aaf99075f0afb20ce2bf70d751f347f0a3c0afb5bf790330a3c0a64f790381d761df752772a0afb80f78b2b1d761dbcf70012aaea80781d79f313f9260afb5ef7941513f6201da076f96e370ab2f8aa330aa076f96e370af75bf8aa381da076f95d370a8df8a52b1da076f8d0f700128ef7017ae778f70113d0300aaff8ae1513e8201d8ea076f858d2daf39277900a13ea501d13e6950a13ea407b05f73bf8c5410a13da640a13ea4e1d440a38f8a2330a440ad8f8a2381d7c1df752772c0afb0cf89d2b1d7c1dbcb90aaaeb97781d98281d35f8a6261d7c1ddaf39277b61deb13ec251dfb05f8bd3e1d8e81cdf936270a7cf8d6330a8e81cdf936270af725f8d6381d8e81cdf925270a57f8d12b1d8e81cdf898f70012e1e67a781d6be713e4241d79f8da1513d8201dfb43540af745c903a5f84d15f72aa07afb08056007a3fbc305b106a3f7c305b6077af708f72a7605e107fb2b759df7500535069dfb50fb2ba1050efb87f842b5f750b501afc0f73ec003f73cf84215dac6c9d5d550c93c3c504d4141c64dda1fb504556cb7bdbdaab7c1c1aa5f59596c5f551f0efb132976f6cdf8a87701aaea03f75afb0b15c40696f60592067b1d82828b8c831fb6f8309d8995889688199f3605bff715066d946693658d92cb185206844b05fb1981203cfb491afb1fcc2cf70c731e31f7a115f713c0cee1951e62fc220551a463c5f7031a0e5e8be0f77dc6f795d212f71ee234ea13f0ccf7d215ce35062b6c5e4d651e56f8580795e005fbf78d06b5b4a7ae8ee88dc918f74cc6fb4a0613e88fed05f71b90d4a3d11bbea9847db21fbb07a5676a9d3d1b22fb034bfb361f2548070e35fb18c2f96bc212aae169d9f757df57e113e8f783fb1815f715cdd4dfc36bb65ba91f13d4d2a4b6bacd1ada55b130af1e3aab0547a678a1ba1ac2bba1bfb8a183829b1ea34505b8f70d06956a5c964c1bfb0c484c3452a163b66f1f13e844735d5f4a1a3cc162e6671edc6b05cf70aa6d5b1a53587253596f9896741e6fdd7d0a93fb17057bb9bc7dd11baaf88e1513e4d56eb176571a5c626c5a821e46a60541a865a0bf1ab8b5aabc951e0ef77f9076f97c77016d1d0e7f2876f9c17701f7cec9cdc903f7c89c0ac9f98ccdfd8cc9f98606d98e0afbae07fb454d4520fb14eb52f69c9c8d8d9b1f0e9d7ec2767a0ac212efe7e2dcd0e578de13baf8237e15f707cad1dde04ea94fad1f5fa4055ea47e9aaa1a137ccff733c7f11adf3fbdfb04fb1d2d31fb071e6e4f1d69f73af8a707e3afd5f3ccab69551e30fb2a58fb011a49ba6ebb701eb7720513bab573b3745d1a5b6573546d7294937b1e72d17d0a92fb0a057eafbb80be1b0ef7597db4f71af75af713b4f719b301b2bef74fd6f705d7f72f430afb32f71a15f733ab06619505f708b507e9fb3205ecab0664953cf713059007b196afa5c31acd55ac341efb386c06b48105fbaf07618105f709f73a15f713b907bc9d7a5d667b70591f0ef7597db4f716b3f7bfb3f710b301b2bef714e2f81b430a94f71615bfb29594a61f92f30566066f400585827889721b3c72c6ebe2a6c4d3a59d8585991fa54c05ae0686ef05927364935e1b243250fb1bfb0ed84cf61f0ef71af84976f789ab12a8f7324ec8f73cb4f762c713ecf7cef83415f700a5066b9305f7568e07dbfb6b05b106ddf76b058efb56066d830571f715a507649305f76507b29305a5fb0e0746fb4a05880648f74a05fb0c7106ae8305fb6607688405fb7a7115f719a506679205f768ba079d4c05ae0686ea05fb8f06872c05ad069dca0513dcbafb68066784050eb31df738f8cc330a30f8d0b90af705781d03f735f8d0261da98e1df739901d13dc570af78ead076f1d50fb62be0713ec691df7e58bc2f73dbec4bef71e77f71dc201f85fed038816f767b4063c9ee8f73805f77bfb380632a31df8a007530afb8cf7a9f710461dfb10f793f7824c1dfcb36206ce81fbe2fcda4d7905f792f77d15f75ef7f905fbf9070ef27876a7881d9d7712adf5f832f513dcb86315ce06c1da0569bcc77acc1b650af70a67e551c71fd3f50548065b450513ecad5a4e9d4b1b590afb0caf2fc64f1f96f7ad15f73ccbf711f721c6b97967ad1efbc7fc570571c080d2e31af764fbcb154e5f9dac6a1ff7c7f85605a3589846321afb3c49fb10fb201e0ef7b78e1de7f70464901df753b71d13ce80570af77bad07600af7816c0af85d07809105fbb3d106d9aba6c4a3998889971eb807947e7296661b36445a211f3bfb62be0713d7008b1d13e700b80713d700620a13e700f95cf8cf155e1df7b78e1df739901df762e7140e13de570af77b740a69f781ad077f1d45fb62be0713ee691d561d521d8ca076f752bfd9bff7d57701f792ed03d8f7d415f73f3dfb3f57f73ffb160632a31df7a8b407329e05f716f73fbffb3fd9f73fbffb2707f730f799bd890afb546207d578fb1ffb8d910afb2cf78dd0890afb786207be78f73bfb9905fb25060ef77f7bbbf91dba01b4bff913c1036d1dbb04fb47fb20f726f747f747f720f725f747f747f721fb25fb47fb47fb21fb26fb471f0ef7977d76f9b8601d0ef7977d76f85cb6f7c5601ddcf315d5f771fb4ef71305f77606d2f76fd2fb6f05f77706fb4ffb13d5fb71fb4cf71e050e800af760f87c8f0afb47fb618f0a0e801db8f87c8f0a0ef78f7876b3c4f7cbc2941df8b2db13eef8a116690acfbcc44d0afc293c541dfcc4fc437b0a13f6481d0efa178f76f943a501b2f70af8f4f70a03f8237a155c1df96a165c1d0efa1781a5f9437701f8f3f70af8f4f70a03facbf8af155b1dfd6a165b1d0ef77f7876b3f73a5db9f8ad77a97712f6d8f874d613cef8efb41d13ae851d13cefc7441541dfcc7fc437b0a13d6481df87dfb2a920af7497fcc5e76f79fc1f726d055c1841df780f31377f7407e15d8ccb5b9af1f13b755b2ca6ae91be0bb6a1d677d421b2150cbf71d871ff7e806f73553f700fb294954725d641ebb765da2451b4b43777a641f3f0a5a07fb1773052b794e64321a136f34cc56e61ef732f70e15615f6179641b4a6daec0bea1b3d1901fee938d59945e9d6619cdf75715f70392b5c1db1bd5ac58211f0e657876a6c2f83ec29f77b61deb13dc9a6315ce06bdcd0572b1bb7dc11b6a0ada73cc61b91fd2ea0548065e4f05a5645c9955ae1d3ba34ab55c1fa9f75b1513ecf732d3bdd6b2ae806fa51efb76fbc0057eab83b6c31af72cfb6e15646896a6711ff776f7c105986a9360541afb324359401e0efb3ffb18caf8aff70812b1eac8f70943c513e8f775fb1815cbb998a2bc1fbb077d5e6e84531b4354abddc5a0a7b9af1fcabcada5c61aaf80a8839e1e5a06926b8e75791a8a5b687a62700838556264361afb16e45ef31ea1f8ee1513f0b11d6b70706c6ba671ab1f0efbde2876f8e2f70812d3f7092adb13d0d59c0af40672f88b055406a5e21513e0b11d6a71706c6ba571ac1f0ef7b17876b3f73a5db9f7019b1d9377a51df833d613dd40f921b41d13bd40851d13dac0fc7741541dfc93fc4a631d13dd402f0a13dcc03e0af84cfb01920af7997876ac9b1d941df8b2d74cdb13f680f70e63541dc4fd64631d13f7002f0a13fa803e0afcfff7b5760afb50fb4bc7f877c6f774c701a9f7fc15dd0645fc1f05497f7175601b76788d8d7f1f5d078597a37fb21bd6c0b0ea9c1fd5f82f05f715c6fb0b069ff505e69ba8a6c61ba59b8987a11fba0794797395611b3a4560fb08761f75fb11052e060ef7a57876abb5f7efb5941df7e7860a13ee40f937710a13ed80560a13ee80770afcbe6b541dfcc5fc437b0a13f640481df90cfbae441d13ed80510af7cca70ac0b6f71dbc9377a51df79b860a13fd48f95e710a13fd30560a13fad0770afcc86b541dfc7ffc4a631d13fd502f0a13fcc83e0af8d0fb85441d13fd30510afb3b951df7c9c2701d53fb4b701d0efb3b951df761c26f0afb87fb596f0a0ef7027ca40af6f714f700f71403f8d87c8a0afc6b16380af77f16380a0e480af74ff868381d6e0af3b70a13f0220a88f883410a13e8640a13f04e1df27d1dd3b70aadf5f832f513ec221dfb03f9693e1df7df990aacf6f7cdef03f81716f88306530afb8af7a9f70e461dfb0ef793f7804c1dfc7b06fb82fb03fb16fb7efb66f4fb0bf7931f99c215fb3a26acf794f774dfd1f7301fd4fcdb060ef7c97fc155cc5e76f7a3c1f730c2b61deaf789f3133ff7a47e15ddd0b4d0b51f135f47aecb62f51b301d39486446651ecf6346b331ae1d1f133ffb35ee22f7281e139f311df786f79e551d0efb4fb40af7debffbde060ee8b40af8f6bffcf6060e800af762661d800af761f87c680a801dba850a0e801db9f87c8a1d0e56f707f70fd2c9d2f70f01f762f71114e0a41df760fb94158c1df7db048c1d0ef7c5a70ad1bcebc79a7712c0baf707dcf797860a13fdc8f957710a13fdb0560a13fdd0770afcd7f7af15f1c7c3dddb54bc2e767888887f1f93f105f73e0691c705fb6f067bfb68058e9ea38fa31bcfae6d5553636f4e686f92956e1f66077ba6ad7dbe1b9cfbcf15d00613fbc8550adafd3b441d13fdb0510a56fb5bc9f91e77dab90af71a781d032e0ac7f997261da84c0ad5f70012f747f678ef72f70313f4f74116f7a6b40613e82f1d13f4337805bff956261dfbfe7876f9857701fb3e63541d0e310afbdd951df727c2701d0efbdd951db6c26f0a0e848e1de7f7046ec712efe7f753b71d13da570af7816c0af85d07809105fbb3d106d9aba6c4a3998889971eb807947e7296661b36445a211f3c4f1d13ecf832f8cf155e1d849f1df762e703f7d616f781ad067f1d464f1d69f77f740a0ef7c57876acbdf72bb6b8c4aebcf777c2937712f76cdbf86ed74cdb13fd80500af72ffbfd15d00613fb40550ac0fd64631d13fd802f0a13fd403e0a0efbfdf799a40a03f701f7998a0a0efc0142681db92d8a1d0efb6242681df7612d680af90d7e0ac0e0f736e113f7e05b0af81616401dfe086f15d00613efe0780af81616711dfdcdb30a13f7e0660a1e0e6e0af76b2d0a81f8632b1d91591df757772b0af72ef94d2b1d480aa6f868330a91591dc1f70012f707ef54781d13fd271df750f9561513fb201d3d0af7f3f952381d641dc4f952330a8c0af76b360a9ff94d2b1d8c0ad5f70012a5f70176ef74f70213f49f16981d13e8349d05f8d30713f4e2720a13e86c1d13f4337905c1f956261d641df76df952381d3c1d3af94e330af27d1df74b77290afb0af9492b1df7a97876abb5f7efb5f76bc79a7712f8a3860a13f280f93b710a13f300560a13ec80770afcd56b541dfc95fc4315e006f732f8010513f480befbad07852105b2069cb905f74b8806f830fced441d13f300510a3c1ddaf94e381d3f1d35f988330a940af76b2a1dfb0ff9832b1d3f1dd5f988381da076f89d370a0e30f8dc76f72a7701f713f8c72b1d30f8eef33176f70a77121360f71af8e715aa9e9a959f1b1380580a1360640a13804e1d30f901c901f70ef90115f788c9fb88060e30f8eecc4af712121340f7a1f8ee15d4c3bfd58e1f5206138061827178631b134063719eb5821f5206418ec357d41b0e30f8d0b90af757f70103f787f8d0152c1d0e30f8d1b2eeb201f731b7edb703f788f8d115450a302eb8bb7701f777f73303f75c750abb5d2e7f0a30f8d676f7427701f7c9f8c1a01dfb1377a01d0e30fb3976f74e7701f731dc03f790fb4e15a79b8e909b1fb0078a837c8a841b687c99a2b0a6afafac1f60065d785460591a60aa6cd11e0e30f8de76f72a7701f771f8c9470a310afc190e561d521da3a11d0191f0f7f3f003f7a94b1dfb69a076f9527701f70bef0395751d448bdcf8bdd201f7e8f0991d4a1d2aad0af7cdec42f013e8f7533b0a83ab0af7d3eb03f76f5d0a2ead1dc8c7f76ef203f745490a67af1d91f1f7b6f003f7923a1d41a076f8f7dd01d4791d6ba11d1291a30af78e340a67ae0a91f0f7b5f203f73b390af7146b0a018b04211d0eaaac0aeab00a8b043b1d97a50a91f503f7d7411dea8bc2f8dbc201eaeff7dcf6991d5a0a9d990aeaef991d230a0e899a1deaef991d5a1de87ec59d1d0191f5f7eaef03f7ed3d1df72faa1de9eff7caef991d4a0afb92540ae9ef991d361d0efb2481cbf9137701f760ef03f708630ae4540ae9ef991d4d1d808bc2f9127701e9ef991d6e1df7bb540ae9d1f86ced991d431df728540aead1f806d0991d351d0eeca50a91f5f832f503f7cc200a0e89ab1de9eff77ff3991d511df7152076f99dc30191f5f832f503f90e400ae7aa0aebeff784f2991d420a367fb81d019ddff795e603f75e2d1d0eb9a90af787f013b0f7265f1df724960a01e7f0f7e9d003f7ea231d0ef701540af7ac670af823a91df779491df1540a8b04451dda471d77b50a018b043a0a0efb8d5d1df733661dfc2c5d1df87c04421d0efc2c5d1df87c04391d0e9e7ec2f890c201b5eef7dcee03f7c17e15f724f709ecf76af76cfb11e6fb1efb20fb0f2bfb6efb67f70b2ef7261fc2042050dff740f73fc4dcf6f5c534fb40fb445342211f0efb5da076f8ee7701f72cef03b616f7c6b106249c05f8b77107fb4f44741df7059605fc5507247a050e228bd8f85fd001f7def1039516f8410697f7360564065d3605fb8c8d06e4cf05f71df4ddd2f41af7093ac7fb0e4542736e5c1e5d079bb8b999c41bf1b4603e4252402b381ffb35fb20050e24fb03c9f7aec4f791c912f7dae846ec13e8f760fb0315f724e8d9f70cf70149c02d9b1f8f0713f0e1a2b9c6de1af70242c8fb134b4f7a735c1e5e079ab7b294c71beab3613a39565b291f6752931dfb01364757265155979d591f5e0772b8cd75db1b0e7e3c76f751c8f84f7701f7dfe903f7d92715e9f751f704c8fb04f84f4006fbdefc540553f7cb07fb81c8158e07f77df7ce058ffbd1060e29fb03c8f7cecdf74bdb01ddc7f769ec03f756fb0315f729f2e5f71ef71540df911df75505f7a40693db05fbe37e1dc15b20264151235360989d581f5e0771b9c076d51b0e667ec0f7d9c7f770c701b5edf7aaed03f7ac7e15f727def0f715f71835d7fb05414e6f6d611ff76e9bf5c7f7011bbabd837fa71fb9079f6d5a994f1bfb31fb32fb06fbabfb5ae6fb13f72d1f8ac015fb076cf70ff7211f9a07a7b1b79dca1bd9c35cfb022762472f1f0e203c76f8f9db01e52715f406f796f90405d0fc440782fb3005b506a8d705f7cc87060e767ebff8fabf12b7e052def795de51e413e4f7ae7e15f732dbe0f704e650c529b41f13d8cca8c8b8e51af633c7fb13fb143b3b2a3bb152de621e13e445723c4d2e1afb07e847f72b1e88bf152456bee0d5b8bdd0a91ff7135bce6d361a3f5b58231eaaf7f71513d8fb00b056acda1acbbfb9d6ceca6836446364536e1e0e66fb05c7f770c7f7d9c001b1edf7aaed03f753fb0515f744f71ff706f7abf75a30f713fb2dfb273826fb15fb18e13ff705d5c8a7a9b51ffb6e7b2c4ffb0c1b5c5993976f1f5d0777a9bc7dc71bd4f7e8153d53baf702efb4cfe7f707aafb0ffb211f7c076f655f794c1b0e7e98f89595f73e9706fb6292071ea02632ff0c099f0ad90b9fa8918d0c0cd9a1c80c0df7a114f8d715b613009a02000100150046004b0065006a0071008c009700a700af00b900c100c700cc0115013b014c01cb01de01ea02540260026b0270027802cf02fc034a0352035b0372038003a203ab03f2043d0445046a0477048a049104c204f204fa04ff0521052d053a0546055b0571057b057f0587059c05a505b105ba05d805e705f10623062d0654066006640674069606a006a906b606db06e306f80701070a070f072f073307460758076507690779079107a207a707b307bc07cc07d007d907df07e307fb0807080c0814081a08210825082b08340839083d08410845084a084f0855085908620868086c087908820886088a089008940898089c08a708ab08af08b208bb08c708d108d708db08e608ed08f108f508ff09090913091d09270931093b0945094f09580961096a0973097c09820988098d099209967f15650a341dfb7df71ffb12f7411f8dc4291d0b6592a67cb31bafac9491971fad72076d7991ab1ff7bb07f258bbfb034b43777a641e3f0a5507fb1770052e784b6d321a0b8816211d0bf8aa06530afb94f7a9f718461dfb18f793f78a4c1dfc964b0a0bf503221d0bd003f7eb231d0bf7a77f15301dfb162229fb38fb33d6fb06f7431efb2ff7d4551d0b7701e1e6f775e703241d0b77841d13bc4f0a137c210a13bc2e1d0b01adf5f832240a0b01aaeaf789f303260a0b01f707ef03271d0b01b80a281d0b7701220a0bf70efb5b15dbb0b4dda91ff75ff8aec39a05affb536707cc7cfb06fbe0910afb15f7e1cf9905affb756707c37cf74efc546d440551726e75511b797f8f90741f5707819cab82a71b0bbb99acadbd1ace5ab03a6263807d701e670793a4a28faf1bc1a3735f5e6e73531f7160aa060b9a16f785870af8654e0afc1d07417b050ba67fcdf756bfd9bfe477f72ac301a6f80e15d4068a7e8b7e7e1a7d8b7e8c7f1e4257d806fb4da4f340f72c1be2c5a8a2ac1fb90781714b75451bfb0d4fc2f71f781ff76cbffb71068a9d8b9fa01a9ef772bffb6f07f71f99c6dbf7081bb1a3837ea31fb4fb0105b60686f7340599606097481bfb1ffb1445fb616e1f3d060e7701f79fef03f74116f7a6b4062f1d3378050b15f759e55ed3fb40fb14050e7e15f737dfe0f704e64fc526b41f13d8cba9ccb9e31af631c7fb17fb18383b2a3bb252e1621e13e43e6d3e522e1afb07e847f7311e88c215205bbbe0d5bfbcc9aa1ff7175bcd6d361a3f5a5b201eadf7f41513d8fb03b057acda1acbbeb6d8d4c36b36445e615a711e0e01cbdff795e603f78c2d1d0b7701f706ef039f16361d0b8d0a300a0baea8a6af460a1f0b7e15f755f719f706f7abf75a2cf713fb33fb2b3327fb16fb18e63ff707d9caa7a6b61ffb6b7d2f52fb171b605d93976e1f5a0777aab77dc41bd5f7ed153b4fb5f702efb8cde9f70bacfb0cfb221f7b0772635d7c4a1b0ef8870695f7517d0a5ffb1805fbbd8f06f815f8de05b9fc700781fb5105bc06b6f71805f7a58706fc14fcde050b8015f729e7d6f70ff70641bb369b1f8f0713f0d8a2c1c6de1af7023ec8fb134b4f79745c1e5c079ab7b093c71beab5603a395661291f674f931d2331475b265055979c5a1f5b0772b8cd76db1b0e761df763772a0a0b91591df768772b0a0bcaa9785259667250676a92946f1f66077ca6b37dbf1b0b600790aac591b41bf1986f3b1f0bfb1415a3e2fb93bf058d07f70eacf0f1f75d1a341dfb7bf71433f36b1eddbc291d0e15aa9e9a959f580a0bf7a8b406359e05f78ff507f744fbcb05f729b306449efb33f7a4058f07d2a2d2baf01af70b40cffb391efbb66206e2731d317805f752f7d515f7a4ef07efb36430426a46211f0ec003f8177d15f75cf730f735f759f759fb30f733fb5cfb5dfb2dfb33fb59fb59f72dfb35f75d1fb404fb48fb0ff723f742f742f70ff722f748f747f710fb22fb42fb42fb10fb23fb471f0b7c1df763772c0a0bc0b3b3bbbc63b3565663635a5bb363c01fb2046e779fa8a89fa0a8a89f766e6e77776e1f0eaf6ea668686e706767a870ae0b15b906f707f70d76a8fb0941fb09d5766e050e6e0af77c2d0a0b8015f735ede3f71ef71535e1911df75205f7b30694de05fbf37e1dc6502926425721525d989d581f5c0771b9c274d71b0e981d349d05f7a2f7cafba20732790562f7a7b407359d05f8d207e19e610ae47805fb91fbcaf791721dfcd2073379050e6206e3731d980a0ba07a0a770bcb1adb56b4375d5e7a7a6d1e640794a6a894ad1bc9a56f5b55655e55561f2426050b078091fb3573741ddb7b050bf7407e15cdb6a6a8a61f91060b9af7ae15690ad0bcc34d0a0b4d9f6f9cb71aaca7a2b6b2ab7a5e647275707d1e0ed306f75df7de05ae07fb5df7dc054306f745fbee050b98f75c7d0a55fb25050b4c0a010bf874f9850546060bb49db0a6be1aca54b13634565b4e5ba269bf731e0b9f16f77fad06600a0ba7b069b61bb6aaadc6a31f0bfb2ffb34fb02fb8c0bf7b406f77df2f716f77ef7662af70bfb8e1ffba84b0af7519915f8db730af755f7d715401df84bfbe315401d0b069686f72aa2056c0a0b16f7b0b4062d9c05f721f704ccfb04f8413a07fbdcfc46054ff7cdfb21072d7a05fb1ef773158e07f778f7c3058ffbc6060e54fb37fb324359401f0b7b1d283bbff731f71ecaceefb49a87869b1f9f3605bff7150697665b935b1bfb26fb0f3efb560b961df762fc2807457b05690b057c0a0b947a6e97601b37405cfb071f4d4f1d0b8115f707cec3f31ff877721dfc6d07356577525b7592956a1e53077fa4ad7ec41b0e639d056c787c81771b0bf72ff733f705f78c0be7a2bec6c5a1552e2d745c510b16d906f76cf90dcb890afb6a6207da78fb39fc8d058606fb38f88ddb890afb8d6207ca9d0a8a1dfb3316391d0ef7ac0693f702056506715605fb288c06cec205de0bf71af702f702f7350ba076f774bef836770bad07840a0bfb5b15f791ad06349b05f7260785a7a688b31bf732f4edf752f75a26930a850bd36b0a0ba71df5f74b05a80721f74b054f06dcfb5a050b341f6f788d891b60078db086a41bf70bf30b8315f2c2bdd2c367ad4ea21f0b9d610a0bd507f735e86afb94fb743f45fb2b1f0ead0746810ac507e6b0a5d3b1a58481ac1efd0107457b050bfb6915f71592beafbd1aba66a13f8e1e0b7b0a481d0e5a796069561a46c361f11e0b550a9dfd3a15711d0bc7068bcbedf61a2306fb22774c8b1e0b76f9490b15f75bad064e95050bb4fba762070b055b060b7876a7baf7b4baf7b4ba937712ace0f736e1f5e0f736e10b07c99f817472747c3b801f0efb625d1d0b8b0af711c6fb110b2876f9e9770b129ff73b2fe70b409b050bf87c15421d0bcf58d2f722ce54d50bad06840a0be379050b9e05b40b15380a0b9b05f8280bfb9c4c0a0b7701eae7030b9d05b40ba71dcbf7610523060b830af775e70b0587060b158c07f712f738058efb39060ebc2a455a726c621f0beb960a0bd6a21d0b7ecbf916770b07880a0b3278050b591d010b077f91fb359b0adc7b050b74741d0bfb0c150b78050e06aa971d6cfb59050b066afb6405c706acf764050b6a72716b6ca470ac1f0ea076f895770b407b050ee74ce4f795e54de913e40bf71201bef7140b7d1d010b7b741d0b7876abb5f785bdc3b50bfb4676f74fc0f82fd20ba076f883f75a54c2120ba076f7cbbef7a4c6010ba076f75bccf84177010b8bc3f7a9bef791c3120b80ccf7aac7f78ccc120b7ecaf76dccf7d2c2010b07417d05f7a4f762150beff778f644f613f40b152c53c2f723f7380b42f73476f82577010bf7e3155174c0e71f0bf799bf01aaf799150b8bc4f8d7c40befe7f762e70bf39277120baaebf7bf0bf700010b0000', '{"content-type":["font/opentype"],"content-length":["46868"],"date":["Tue, 06 Dec 2016 20:24:47 GMT"],"connection":["close"]}', 'https://alastairtest.ngrok.io/reader/gdn.otf', 'https://alastairtest.ngrok.io/reader/sw.js', 200)