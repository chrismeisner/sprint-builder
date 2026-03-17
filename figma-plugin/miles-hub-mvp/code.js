figma.showUI(__html__, { width: 460, height: 640 });

function debugLog(message, payload) {
  if (payload !== undefined) {
    console.log("[MilesHubMVP]", message, payload);
  } else {
    console.log("[MilesHubMVP]", message);
  }
}

function modeIdToNameMap(collection) {
  const map = new Map();
  for (const mode of collection.modes) {
    map.set(mode.modeId, mode.name);
  }
  return map;
}

function postStatus(message, level) {
  debugLog("status:" + (level || "info") + " " + message);
  figma.ui.postMessage({
    type: "status",
    level: level || "info",
    message,
  });
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "http://localhost:3000").replace(/\/+$/, "");
}

async function fetchJson(url) {
  const startedAt = Date.now();
  debugLog("fetch:start " + url);
  const response = await fetch(url);
  debugLog("fetch:response " + url, {
    status: response.status,
    ok: response.ok,
    elapsedMs: Date.now() - startedAt,
  });
  if (!response.ok) {
    throw new Error("Request failed (" + response.status + "): " + url);
  }
  const json = await response.json();
  debugLog("fetch:json-ok " + url);
  return json;
}

function flattenTokenSet(node, prefix) {
  const out = {};
  const currentPrefix = prefix || "";
  const entries = Object.entries(node || {});
  for (const [key, value] of entries) {
    const nextPath = currentPrefix ? currentPrefix + "/" + key : key;
    if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "$value")) {
      out[nextPath] = value;
      continue;
    }
    if (value && typeof value === "object") {
      const nested = flattenTokenSet(value, nextPath);
      for (const [nKey, nValue] of Object.entries(nested)) {
        out[nKey] = nValue;
      }
    }
  }
  return out;
}

function guessVariableType(token) {
  const tokenType = String(token && token.$type ? token.$type : "").toLowerCase();
  if (tokenType === "color") return "COLOR";
  if (tokenType === "dimension") return "FLOAT";
  if (tokenType === "number") return "FLOAT";
  if (tokenType === "shadow") return "STRING";
  const value = token ? token.$value : undefined;
  if (typeof value === "number") return "FLOAT";
  if (typeof value === "string" && /^#/.test(value.trim())) return "COLOR";
  return "STRING";
}

function hexToColor(hex) {
  let value = String(hex || "").trim().replace("#", "");
  if (value.length === 3 || value.length === 4) {
    value = value
      .split("")
      .map(function (ch) {
        return ch + ch;
      })
      .join("");
  }
  if (!(value.length === 6 || value.length === 8)) {
    throw new Error("Unsupported hex color: " + hex);
  }
  const hasAlpha = value.length === 8;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const a = hasAlpha ? parseInt(value.slice(6, 8), 16) / 255 : 1;
  return { r: r, g: g, b: b, a: a };
}

function toHexByte(value) {
  const clamped = Math.max(0, Math.min(255, Math.round(value * 255)));
  return clamped.toString(16).padStart(2, "0");
}

function colorToHex(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.r !== "number" || typeof value.g !== "number" || typeof value.b !== "number") {
    return null;
  }
  const alpha = typeof value.a === "number" ? value.a : 1;
  const base = "#" + toHexByte(value.r) + toHexByte(value.g) + toHexByte(value.b);
  if (Math.abs(alpha - 1) < 0.0001) return base.toLowerCase();
  return (base + toHexByte(alpha)).toLowerCase();
}

function normalizeHex(input) {
  try {
    return colorToHex(hexToColor(input));
  } catch (_err) {
    return null;
  }
}

function parseFloatTokenValue(rawValue) {
  if (typeof rawValue === "number") return rawValue;
  const value = String(rawValue || "").trim().toLowerCase();
  if (value.endsWith("px")) return parseFloat(value.slice(0, -2));
  if (value.endsWith("rem")) return parseFloat(value.slice(0, -3)) * 16;
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Unable to parse number from: " + rawValue);
  }
  return parsed;
}

function convertValueForVariable(variableType, rawValue) {
  if (variableType === "COLOR") return hexToColor(rawValue);
  if (variableType === "FLOAT") return parseFloatTokenValue(rawValue);
  return String(rawValue == null ? "" : rawValue);
}

function describeModeValue(value) {
  if (value == null) return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && value.type === "VARIABLE_ALIAS") {
    return "alias(" + value.id + ")";
  }
  const hex = colorToHex(value);
  if (hex) return hex;
  try {
    return JSON.stringify(value);
  } catch (_err) {
    return String(value);
  }
}

function getVariableModeValue(variable, modeId) {
  if (!variable || !variable.valuesByMode) return undefined;
  return variable.valuesByMode[modeId];
}

async function getOrCreateCollection(name) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existing = collections.find(function (collection) {
    return collection.name === name;
  });
  if (existing) {
    debugLog("collection:reuse " + name, { id: existing.id, modes: existing.modes.length });
    return existing;
  }
  const created = figma.variables.createVariableCollection(name);
  debugLog("collection:create " + name, { id: created.id });
  return created;
}

function normalizeModeName(name) {
  return String(name || "").trim().toLowerCase();
}

async function ensureModes(collection, modeNames) {
  const desired = modeNames.slice();
  if (desired.length === 0) {
    return [collection.defaultModeId];
  }

  const byName = new Map();
  for (const mode of collection.modes) {
    byName.set(normalizeModeName(mode.name), mode.modeId);
  }

  const modeIds = [];
  for (let index = 0; index < desired.length; index += 1) {
    const desiredName = desired[index];
    const key = normalizeModeName(desiredName);
    let modeId = byName.get(key);
    if (!modeId) {
      if (index === 0 && collection.modes.length === 1) {
        const onlyMode = collection.modes[0];
        collection.renameMode(onlyMode.modeId, desiredName);
        debugLog("mode:rename", {
          collection: collection.name,
          modeId: onlyMode.modeId,
          to: desiredName,
        });
        modeId = onlyMode.modeId;
        byName.set(key, modeId);
      } else {
        modeId = collection.addMode(desiredName);
        debugLog("mode:create", {
          collection: collection.name,
          modeId,
          name: desiredName,
        });
        byName.set(key, modeId);
      }
    }
    modeIds.push(modeId);
  }
  return modeIds;
}

async function getCollectionVariableMap(collection) {
  const map = new Map();
  for (const variableId of collection.variableIds) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (variable) {
      map.set(variable.name, variable);
    }
  }
  return map;
}

async function upsertVariable(variableMap, collection, variableName, variableType) {
  const existing = variableMap.get(variableName);
  if (existing) {
    return { variable: existing, created: false };
  }
  // Passing collection node avoids deprecated collection-id signature.
  const created = figma.variables.createVariable(variableName, collection, variableType);
  debugLog("variable:create", {
    collection: collection.name,
    name: variableName,
    type: variableType,
  });
  variableMap.set(variableName, created);
  return { variable: created, created: true };
}

async function upsertSingleModeTokenSet(collectionName, tokenSet, modeName, stats) {
  const collection = await getOrCreateCollection(collectionName);
  const [modeId] = await ensureModes(collection, [modeName || "Base"]);
  const variableMap = await getCollectionVariableMap(collection);
  const flat = flattenTokenSet(tokenSet);
  debugLog("token-set:start", {
    collection: collectionName,
    mode: modeName || "Base",
    tokenCount: Object.keys(flat).length,
  });

  for (const [tokenPath, token] of Object.entries(flat)) {
    const variableType = guessVariableType(token);
    const value = token.$value;
    if (value == null) {
      stats.skipped += 1;
      stats.messages.push("Skipped empty token: " + collectionName + "/" + tokenPath);
      continue;
    }

    try {
      const { variable, created } = await upsertVariable(
        variableMap,
        collection,
        tokenPath,
        variableType
      );
      const converted = convertValueForVariable(variableType, value);
      variable.setValueForMode(modeId, converted);
      if (created) stats.created += 1;
      else stats.updated += 1;
    } catch (err) {
      stats.errors += 1;
      stats.messages.push(
        "Failed token " + collectionName + "/" + tokenPath + ": " + String(err && err.message ? err.message : err)
      );
    }
  }
  debugLog("token-set:done", {
    collection: collectionName,
    created: stats.created,
    updated: stats.updated,
    skipped: stats.skipped,
    errors: stats.errors,
  });
}

function mergeSemanticByPath(lightSet, darkSet) {
  const lightFlat = flattenTokenSet(lightSet || {});
  const darkFlat = flattenTokenSet(darkSet || {});
  const merged = new Map();

  for (const [key, token] of Object.entries(lightFlat)) {
    merged.set(key, {
      type: guessVariableType(token),
      light: token.$value,
      dark: undefined,
    });
  }

  for (const [key, token] of Object.entries(darkFlat)) {
    const prev = merged.get(key);
    if (prev) {
      prev.dark = token.$value;
      merged.set(key, prev);
    } else {
      merged.set(key, {
        type: guessVariableType(token),
        light: undefined,
        dark: token.$value,
      });
    }
  }

  return merged;
}

async function upsertSemanticModes(lightSet, darkSet, stats) {
  const collection = await getOrCreateCollection("semantic");
  const modeIds = await ensureModes(collection, ["Light", "Dark"]);
  const lightModeId = modeIds[0];
  const darkModeId = modeIds[1];
  const variableMap = await getCollectionVariableMap(collection);
  const merged = mergeSemanticByPath(lightSet, darkSet);
  const primitivesCollection = await getOrCreateCollection("primitives");
  const primitiveModeIds = await ensureModes(primitivesCollection, ["Base"]);
  const primitiveModeId = primitiveModeIds[0];
  const primitiveVariableMap = await getCollectionVariableMap(primitivesCollection);
  const primitiveColorByHex = new Map();
  for (const variable of primitiveVariableMap.values()) {
    if (variable.resolvedType !== "COLOR") continue;
    const modeValue = getVariableModeValue(variable, primitiveModeId);
    const colorHex = colorToHex(modeValue);
    if (colorHex && !primitiveColorByHex.has(colorHex)) {
      primitiveColorByHex.set(colorHex, variable);
    }
  }
  debugLog("semantic:start", {
    tokenCount: merged.size,
    lightModeId,
    darkModeId,
    primitiveColorCandidates: primitiveColorByHex.size,
  });

  for (const [tokenPath, token] of merged.entries()) {
    try {
      const { variable, created } = await upsertVariable(
        variableMap,
        collection,
        tokenPath,
        token.type
      );
      if (token.light != null) {
        let linked = false;
        if (token.type === "COLOR") {
          const lightHex = normalizeHex(token.light);
          const primitiveMatch = lightHex ? primitiveColorByHex.get(lightHex) : null;
          if (primitiveMatch) {
            variable.setValueForMode(
              lightModeId,
              figma.variables.createVariableAlias(primitiveMatch)
            );
            stats.aliasLinked += 1;
            linked = true;
            debugLog("semantic:alias-linked", {
              semantic: tokenPath,
              mode: "Light",
              primitive: primitiveMatch.name,
              value: lightHex,
            });
          }
        }
        if (!linked) {
          variable.setValueForMode(
            lightModeId,
            convertValueForVariable(token.type, token.light)
          );
        }
      }
      if (token.dark != null) {
        let linked = false;
        if (token.type === "COLOR") {
          const darkHex = normalizeHex(token.dark);
          const primitiveMatch = darkHex ? primitiveColorByHex.get(darkHex) : null;
          if (primitiveMatch) {
            variable.setValueForMode(
              darkModeId,
              figma.variables.createVariableAlias(primitiveMatch)
            );
            stats.aliasLinked += 1;
            linked = true;
            debugLog("semantic:alias-linked", {
              semantic: tokenPath,
              mode: "Dark",
              primitive: primitiveMatch.name,
              value: darkHex,
            });
          }
        }
        if (!linked) {
          variable.setValueForMode(
            darkModeId,
            convertValueForVariable(token.type, token.dark)
          );
        }
      }
      if (created) stats.created += 1;
      else stats.updated += 1;
    } catch (err) {
      stats.errors += 1;
      stats.messages.push(
        "Failed semantic token " + tokenPath + ": " + String(err && err.message ? err.message : err)
      );
    }
  }
  debugLog("semantic:done", {
    created: stats.created,
    updated: stats.updated,
    aliasLinked: stats.aliasLinked,
    errors: stats.errors,
  });
}

function candidateFontStyles(fontStyle) {
  const style = String(fontStyle || "Regular");
  if (style === "Semi Bold") return ["Semi Bold", "Semibold", "Medium", "Regular"];
  if (style === "Black") return ["Black", "Extra Bold", "Bold", "Regular"];
  if (style === "Extra Bold") return ["Extra Bold", "Bold", "Semi Bold", "Regular"];
  if (style === "Bold") return ["Bold", "Semi Bold", "Medium", "Regular"];
  if (style === "Medium") return ["Medium", "Regular"];
  if (style === "Light") return ["Light", "Regular"];
  return [style, "Regular"];
}

async function loadAnyFont(fontFamily, fontStyle) {
  const candidates = candidateFontStyles(fontStyle);
  debugLog("font:try", { family: fontFamily, preferred: fontStyle, candidates });
  for (const style of candidates) {
    try {
      await figma.loadFontAsync({ family: fontFamily, style: style });
      debugLog("font:loaded", { family: fontFamily, style });
      return { family: fontFamily, style: style };
    } catch (_err) {
      // try next
    }
  }
  throw new Error("Unable to load font: " + fontFamily + " " + fontStyle);
}

async function upsertTextStyles(typographyResponse, stats) {
  const styles = Array.isArray(typographyResponse && typographyResponse.styles)
    ? typographyResponse.styles
    : [];

  if (styles.length === 0) {
    stats.messages.push("No typography styles returned from /hub/typography");
    debugLog("text-style:none");
    return;
  }
  debugLog("text-style:start", { styleCount: styles.length });

  const existingStyles = figma.getLocalTextStyles();
  const byName = new Map(existingStyles.map(function (style) {
    return [style.name, style];
  }));

  for (const item of styles) {
    try {
      const fontName = await loadAnyFont(item.fontFamily || "Inter", item.fontStyle || "Regular");
      const style = byName.get(item.name) || figma.createTextStyle();
      if (!byName.has(item.name)) {
        style.name = item.name;
        byName.set(item.name, style);
        stats.stylesCreated += 1;
      } else {
        stats.stylesUpdated += 1;
      }
      style.fontName = fontName;
      style.fontSize = Number(item.fontSizePx || 14);
      style.lineHeight = {
        unit: "PIXELS",
        value: Number(item.lineHeightPx || item.fontSizePx || 14),
      };
      style.letterSpacing = {
        unit: "PERCENT",
        value: Number(item.letterSpacingPercent || 0),
      };
    } catch (err) {
      stats.errors += 1;
      stats.messages.push(
        "Failed text style " + String(item && item.name ? item.name : "<unknown>") + ": " + String(err && err.message ? err.message : err)
      );
    }
  }
  debugLog("text-style:done", {
    stylesCreated: stats.stylesCreated,
    stylesUpdated: stats.stylesUpdated,
    errors: stats.errors,
  });
}

async function runSync(baseUrl, shouldSyncTextStyles) {
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    aliasLinked: 0,
    errors: 0,
    stylesCreated: 0,
    stylesUpdated: 0,
    messages: [],
  };

  const normalizedBase = normalizeBaseUrl(baseUrl);
  debugLog("sync:start", { baseUrl: normalizedBase, syncTextStyles: shouldSyncTextStyles });
  postStatus("Fetching token JSON from " + normalizedBase + "/sandboxes/miles-proto-2/hub/tokens");
  const tokens = await fetchJson(
    normalizedBase + "/sandboxes/miles-proto-2/hub/tokens"
  );

  postStatus("Upserting token collections and variables...");
  await upsertSingleModeTokenSet(
    "primitives",
    tokens.primitives || {},
    "Base",
    stats
  );
  await upsertSingleModeTokenSet(
    "typography",
    tokens.typography || {},
    "Base",
    stats
  );
  await upsertSingleModeTokenSet(
    "state",
    tokens.state || {},
    "Base",
    stats
  );
  await upsertSingleModeTokenSet("sizing", tokens.sizing || {}, "Base", stats);
  await upsertSemanticModes(tokens["semantic-light"] || {}, tokens["semantic-dark"] || {}, stats);

  if (shouldSyncTextStyles) {
    postStatus("Fetching typography styles from /hub/typography...");
    const typography = await fetchJson(
      normalizedBase + "/sandboxes/miles-proto-2/hub/typography"
    );
    postStatus("Upserting text styles...");
    await upsertTextStyles(typography, stats);
  }

  debugLog("sync:done", stats);
  return stats;
}

async function loadSampleFonts() {
  const candidates = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Semibold" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "Bold" },
  ];
  for (const font of candidates) {
    try {
      await figma.loadFontAsync(font);
      return font;
    } catch (_err) {
      // continue
    }
  }
  await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
  return { family: "Roboto", style: "Regular" };
}

function makeAutoLayoutFrame(name, mode, spacing, padding) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = mode;
  frame.itemSpacing = spacing;
  frame.counterAxisSizingMode = "AUTO";
  frame.primaryAxisSizingMode = "AUTO";
  frame.paddingLeft = padding;
  frame.paddingRight = padding;
  frame.paddingTop = padding;
  frame.paddingBottom = padding;
  frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
  frame.strokeWeight = 1;
  frame.cornerRadius = 12;
  return frame;
}

function createTextNode(content, fontName, fontSize) {
  const text = figma.createText();
  text.fontName = fontName;
  text.fontSize = fontSize;
  text.characters = content;
  text.fills = [{ type: "SOLID", color: { r: 0.11, g: 0.11, b: 0.12 } }];
  return text;
}

function buildBoundColorPaint(variable, fallbackModeValue) {
  const opacity =
    fallbackModeValue && typeof fallbackModeValue.a === "number"
      ? fallbackModeValue.a
      : 1;
  const basePaint = {
    type: "SOLID",
    color:
      fallbackModeValue &&
      typeof fallbackModeValue.r === "number" &&
      typeof fallbackModeValue.g === "number" &&
      typeof fallbackModeValue.b === "number"
        ? { r: fallbackModeValue.r, g: fallbackModeValue.g, b: fallbackModeValue.b }
        : { r: 0.75, g: 0.75, b: 0.78 },
    opacity: opacity,
  };

  // Bind the paint to the variable so mode changes stay live.
  if (
    figma.variables &&
    typeof figma.variables.setBoundVariableForPaint === "function" &&
    variable
  ) {
    try {
      return figma.variables.setBoundVariableForPaint(basePaint, "color", variable);
    } catch (err) {
      debugLog("color-samples:bind-failed", {
        variable: variable.name,
        error: String(err && err.message ? err.message : err),
      });
    }
  }

  return basePaint;
}

function createCollectionSection(collection, variables, fontName, width) {
  const sectionPadding = 12;
  const headerHeight = 20;
  const rowHeight = 24;
  const section = figma.createFrame();
  section.name = collection.name;
  section.resize(width, sectionPadding * 2 + headerHeight + variables.length * rowHeight);
  section.fills = [{ type: "SOLID", color: { r: 0.985, g: 0.985, b: 0.99 } }];
  section.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.92 } }];
  section.strokeWeight = 1;
  section.cornerRadius = 10;
  section.clipsContent = false;

  const header = createTextNode(
    collection.name + " (" + variables.length + ")",
    fontName,
    12
  );
  header.x = sectionPadding;
  header.y = sectionPadding;
  section.appendChild(header);

  const modeNameMap = modeIdToNameMap(collection);
  let cursorY = sectionPadding + headerHeight;
  for (const variable of variables) {
    const row = figma.createFrame();
    row.name = variable.name;
    row.resize(width - sectionPadding * 2, rowHeight - 2);
    row.x = sectionPadding;
    row.y = cursorY;
    row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    row.strokes = [{ type: "SOLID", color: { r: 0.93, g: 0.93, b: 0.95 } }];
    row.strokeWeight = 1;
    row.cornerRadius = 6;
    row.clipsContent = false;

    const preview = figma.createRectangle();
    preview.resize(12, 12);
    preview.cornerRadius = 999;
    preview.x = 8;
    preview.y = 5;
    const modeValue = getVariableModeValue(variable, collection.defaultModeId);
    const fallbackModeValue =
      modeValue && typeof modeValue === "object" && modeValue.type !== "VARIABLE_ALIAS"
        ? modeValue
        : null;
    preview.fills = [buildBoundColorPaint(variable, fallbackModeValue)];
    row.appendChild(preview);

    const label = createTextNode(variable.name, fontName, 11);
    label.x = 26;
    label.y = 5;
    row.appendChild(label);

    const modeParts = [];
    for (const mode of collection.modes) {
      const raw = getVariableModeValue(variable, mode.modeId);
      modeParts.push(modeNameMap.get(mode.modeId) + ": " + describeModeValue(raw));
    }
    const valuesText = createTextNode(modeParts.join("  |  "), fontName, 10);
    valuesText.fills = [{ type: "SOLID", color: { r: 0.42, g: 0.42, b: 0.46 } }];
    valuesText.x = Math.floor((width - sectionPadding * 2) * 0.46);
    valuesText.y = 6;
    row.appendChild(valuesText);

    section.appendChild(row);
    cursorY += rowHeight;
  }

  return section;
}

async function createColorSamplesPage() {
  postStatus("Creating color sample layers from local variables...");
  debugLog("color-samples:start");

  const fontName = await loadSampleFonts();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  const page = figma.createPage();
  page.name = "Miles Color Samples";
  figma.currentPage = page;
  const title = createTextNode("Miles Color Samples", fontName, 18);
  title.fills = [{ type: "SOLID", color: { r: 0.08, g: 0.08, b: 0.1 } }];
  title.x = 120;
  title.y = 90;
  page.appendChild(title);

  const subtitle = createTextNode(
    "Auto-generated from COLOR variables. Re-run safely as tokens evolve.",
    fontName,
    11
  );
  subtitle.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.45 } }];
  subtitle.x = 120;
  subtitle.y = 116;
  page.appendChild(subtitle);

  const preferredOrder = ["primitives", "typography", "state", "semantic", "sizing"];
  const sortedCollections = collections.slice().sort((a, b) => {
    const ai = preferredOrder.indexOf(a.name);
    const bi = preferredOrder.indexOf(b.name);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    return av - bv || a.name.localeCompare(b.name);
  });

  let totalVariables = 0;
  let includedCollections = 0;
  let cursorY = 144;
  const sectionWidth = 1080;
  for (const collection of sortedCollections) {
    const vars = [];
    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable && variable.resolvedType === "COLOR") vars.push(variable);
    }
    vars.sort((a, b) => a.name.localeCompare(b.name));
    if (vars.length === 0) continue;
    includedCollections += 1;
    totalVariables += vars.length;

    const section = createCollectionSection(collection, vars, fontName, sectionWidth);
    section.x = 120;
    section.y = cursorY;
    page.appendChild(section);
    cursorY += section.height + 14;
  }

  const nodesToView = page.children.length > 0 ? page.children : [page];
  figma.viewport.scrollAndZoomIntoView(nodesToView);

  debugLog("color-samples:done", {
    collections: includedCollections,
    variables: totalVariables,
    page: page.name,
  });
  postStatus(
    "Color sample page created: " +
      includedCollections +
      " collections, " +
      totalVariables +
      " variables.",
    "success"
  );
  figma.notify("Miles color sample page created (" + totalVariables + " variables)");
}

figma.ui.onmessage = async function (msg) {
  debugLog("ui:message", msg);
  if (!msg) return;

  if (msg.type === "create-color-samples" || msg.type === "create-samples") {
    try {
      await createColorSamplesPage();
      figma.ui.postMessage({ type: "result", ok: true, stats: { messages: [] } });
    } catch (err) {
      const message = String(err && err.message ? err.message : err);
      postStatus("Sample creation failed: " + message, "error");
      figma.notify("Sample creation failed", { error: true });
      figma.ui.postMessage({
        type: "result",
        ok: false,
        stats: { messages: [message] },
      });
    }
    return;
  }

  if (msg.type !== "run-sync") return;

  try {
    const stats = await runSync(msg.baseUrl, !!msg.syncTextStyles);
    postStatus(
      "Done. Variables created: " +
        stats.created +
        ", updated: " +
        stats.updated +
        ", semantic aliases linked: " +
        stats.aliasLinked +
        ", styles created: " +
        stats.stylesCreated +
        ", styles updated: " +
        stats.stylesUpdated +
        ", errors: " +
        stats.errors,
      stats.errors > 0 ? "warn" : "success"
    );
    figma.ui.postMessage({
      type: "result",
      ok: stats.errors === 0,
      stats,
    });
    figma.notify(
      "Miles Hub sync complete (" +
        stats.created +
        " created, " +
        stats.updated +
        " updated, " +
        stats.aliasLinked +
        " aliases, " +
        stats.errors +
        " errors)"
    );
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    postStatus("Sync failed: " + message, "error");
    figma.notify("Miles Hub sync failed", { error: true });
    figma.ui.postMessage({
      type: "result",
      ok: false,
      stats: {
        created: 0,
        updated: 0,
        skipped: 0,
        aliasLinked: 0,
        errors: 1,
        stylesCreated: 0,
        stylesUpdated: 0,
        messages: [message],
      },
    });
  }
};

debugLog("plugin:boot");

