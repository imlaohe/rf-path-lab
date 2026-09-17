import {
  MODEL_META, calculate, dbmToWatts, findMaxDistance, validateModel
} from './calculator.mjs';

const defaults = {
  model: 'hf_ground', txPowerDbm: 43.01, frequencyMHz: 10, distanceKm: 50, plotMaxKm: 500,
  txGainDbi: 0, rxGainDbi: 0, txFeedLossDb: 1, rxFeedLossDb: 1,
  additionalLossDb: 3, rxSensitivityDbm: -120, requiredFadeMarginDb: 12,
  bandwidthKhz: 24, noiseFigureDb: 6, externalNoiseDb: 12, requiredSnrDb: 8,
  implementationMarginDb: 2, useCalculatedSensitivity: true,
  txHeightM: 4.8, rxHeightM: 2, referenceDistanceKm: 1, pathExponent: 3,
  shadowLossDb: 6, groundAttenDbPer100Km: 12, groundExponent: 0.82,
  groundLinearDbPerKm: 0.12, verticalAbsorption10MHzDb: 6,
  virtualHeightKm: 300, hops: 2, absorptionDbPerHop: 6, reflectionLossDbPerHop: 2,
  foF2MHz: 5.5, manualLossDb: 110, manualExponent: 3, largeCity: false,
  obstacleHeightM: 8, obstaclePositionFraction: 0.5, useSiteGeometry: false,
  txSiteElevationM: 200, rxSiteElevationM: 0, terrainClutterLossDb: 6
};

const state = { ...defaults };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const nfmt = (n, digits = 1) => Number.isFinite(n) ? n.toLocaleString('zh-CN', { maximumFractionDigits: digits }) : '—';

const commonFields = [
  ['txPowerDbm', '发射功率', 'dBm', 0.1, '发射机端口输出。43.01 dBm ≈ 20 W。'],
  ['frequencyMHz', '工作频率', 'MHz', 0.01, '决定波长与自由空间损耗，也是模型适用性判断的关键。'],
  ['bandwidthKhz', '接收噪声带宽', 'kHz', 0.1, '带宽扩大 10 倍，热噪声增加 10 dB。短波语音可从约 2.4–3 kHz 起，宽带信道可按实际值填写。'],
  ['distanceKm', '当前距离', 'km', 0.1, '用于顶部结果卡和预算分解。'],
  ['plotMaxKm', '曲线基准范围（下限）', 'km', 1, '距离探索图的基准上限；为保证能看到门限距离，实际绘图范围会自动扩展，本值不会限制可用距离。'],
  ['txGainDbi', '发射天线增益', 'dBi', 0.1, '相对各向同性天线的方向增益。'],
  ['rxGainDbi', '接收天线增益', 'dBi', 0.1, '接收方向上的有效增益。'],
  ['txFeedLossDb', '发射馈线损耗', 'dB', 0.1, '功放到天线之间的电缆、开关与匹配损耗。'],
  ['rxFeedLossDb', '接收馈线损耗', 'dB', 0.1, '接收天线到接收机端口的损耗。'],
  ['additionalLossDb', '其他固定损耗', 'dB', 0.1, '极化失配、连接器、人体/车体遮挡等额外预算项。'],
  ['useCalculatedSensitivity', '由带宽与噪声自动计算灵敏度', '', 1, '开启后使用噪声带宽、噪声系数、外部噪声和所需 SNR 计算判决门限。', 'checkbox'],
  ['rxSensitivityDbm', '手动接收灵敏度', 'dBm', 0.1, '关闭自动灵敏度时使用。'],
  ['noiseFigureDb', '接收机噪声系数 NF', 'dB', 0.1, '接收机内部噪声相对理想热噪声的恶化。'],
  ['externalNoiseDb', '外部噪声因子 Fa', 'dB', 0.1, '天线端大气、人为和银河噪声相对 kT₀ 的等效值；HF 通常明显高于 VHF。'],
  ['requiredSnrDb', '解调所需 SNR', 'dB', 0.1, '与调制方式、编码和目标误码率有关。'],
  ['implementationMarginDb', '接收实现余量', 'dB', 0.1, '量化、滤波、同步与器件偏差的预留。'],
  ['requiredFadeMarginDb', '要求衰落余量', 'dB', 0.1, '从原始链路余量中预留，用于覆盖快衰落、环境变化和模型误差。']
];

const modelFields = {
  log: [
    ['referenceDistanceKm', '参考距离 d₀', 'km', 0.1, '通常取 1 m、10 m 或 1 km，需与场景标定一致。'],
    ['pathExponent', '路径损耗指数 n', '', 0.1, '自由空间约 2；有遮挡环境通常更大。'],
    ['shadowLossDb', '阴影衰落项 X', 'dB', 0.1, '本次保守估算采用的附加阴影损耗。']
  ],
  two_ray: [
    ['txHeightM', '发射天线高度', 'm', 0.1, '用于计算交叉距离和远区双径损耗。'],
    ['rxHeightM', '接收天线高度', 'm', 0.1, '用于计算交叉距离和远区双径损耗。']
  ],
  hata_urban: [['txHeightM', '基站天线高度', 'm', 1, 'Hata 典型范围为 30–200 m。'], ['rxHeightM', '移动台天线高度', 'm', 0.1, 'Hata 典型范围为 1–10 m。']],
  hata_suburban: [['txHeightM', '基站天线高度', 'm', 1, 'Hata 典型范围为 30–200 m。'], ['rxHeightM', '移动台天线高度', 'm', 0.1, 'Hata 典型范围为 1–10 m。']],
  hata_open: [['txHeightM', '基站天线高度', 'm', 1, 'Hata 典型范围为 30–200 m。'], ['rxHeightM', '移动台天线高度', 'm', 0.1, 'Hata 典型范围为 1–10 m。']],
  cost231: [['txHeightM', '基站天线高度', 'm', 1, '建议 30–200 m。'], ['rxHeightM', '移动台天线高度', 'm', 0.1, '建议 1–10 m。'], ['largeCity', '大城市修正', '', 1, '启用时改用大城市 a(h_m) 修正，并叠加 3 dB 的城市中心修正 C_m。', 'checkbox']],
  egli: [['txHeightM', '发射天线高度', 'm', 0.1, 'Egli 公式内部自动换算为 ft。'], ['rxHeightM', '接收天线高度', 'm', 0.1, 'Egli 公式内部自动换算为 ft。']],
  knife_edge: [
    ['txHeightM', '发射天线高度', 'm', 0.1, '用于无线电视距与菲涅耳区诊断。'],
    ['rxHeightM', '接收天线高度', 'm', 0.1, '用于无线电视距与菲涅耳区诊断。'],
    ['obstacleHeightM', '障碍物高出视距线', 'm', 0.1, '正值表示侵入视距线，负值表示低于视距线。'],
    ['obstaclePositionFraction', '障碍物路径位置', '0–1', 0.01, '0.5 表示障碍物位于路径中点。']
  ],
  vhf_elevated: [
    ['txSiteElevationM', '山腰端站点海拔', 'm', 1, '站点地面海拔或相对基准高度，不包含天线杆。'],
    ['txHeightM', '山腰端天线离地高度', 'm', 0.1, '天线相对当地地面的高度。'],
    ['rxSiteElevationM', '地面端站点海拔', 'm', 1, '应与山腰端采用同一高程基准。'],
    ['rxHeightM', '地面端天线离地高度', 'm', 0.1, '天线相对当地地面的高度。'],
    ['terrainClutterLossDb', '地形/植被附加损耗', 'dB', 0.5, '路径视距但存在植被、建筑、安装位置等影响时的保守预算项。']
  ],
  hf_ground_linear: [
    ['groundLinearDbPerKm', '地表附加衰减 αg', 'dB/km', 0.01, '应由目标地表与频率下的实测数据标定。']
  ],
  hf_ground: [
    ['groundAttenDbPer100Km', '100 km 附加衰减 A₁₀₀', 'dB', 0.1, '用当地表条件或实测值标定；海水更低，干燥地面更高。'],
    ['groundExponent', '距离指数 p', '', 0.01, '控制附加地波损耗随距离增长的速度。'],
    ['useSiteGeometry', '启用实测站点高差诊断', '', 1, '计算两端绝对高差、路径俯仰角、地球曲率和第一菲涅耳区。', 'checkbox'],
    ['txSiteElevationM', '山腰端站点高度', 'm', 1, '相对统一基准的地面高度，不包含天线杆。'],
    ['txHeightM', '山腰端天线离地高度', 'm', 0.1, '天线相对当地地面的高度。'],
    ['rxSiteElevationM', '地面端站点高度', 'm', 1, '与山腰端使用同一个高度基准。'],
    ['rxHeightM', '地面端天线离地高度', 'm', 0.1, '天线相对当地地面的高度。']
  ],
  hf_nvis: [
    ['virtualHeightKm', '电离层虚高', 'km', 10, 'F 层工程估算常取约 250–350 km。'],
    ['absorptionDbPerHop', '每跳吸收损耗', 'dB', 0.5, 'D/E 层吸收的经验预算项，昼夜与太阳活动影响显著。'],
    ['reflectionLossDbPerHop', '每跳反射/散射损耗', 'dB', 0.5, '电离层不规则与地面反射的合并经验项。'],
    ['foF2MHz', '参考 foF2', 'MHz', 0.1, '仅用于风险提示，不代替实时 MUF 预测。']
  ],
  hf_single: [
    ['virtualHeightKm', '电离层虚高', 'km', 10, 'F 层工程估算常取约 250–350 km。'],
    ['absorptionDbPerHop', '单跳吸收损耗', 'dB', 0.5, 'D/E 层吸收的经验预算项。'],
    ['reflectionLossDbPerHop', '反射/散射损耗', 'dB', 0.5, '电离层与地面效应的合并经验项。'],
    ['foF2MHz', '参考 foF2', 'MHz', 0.1, '用于 secant law 的 MUF/OWF 估算。']
  ],
  hf_sky: [
    ['virtualHeightKm', '电离层虚高', 'km', 10, '用于球面地球多跳几何。'],
    ['hops', '跳数', '跳', 1, '整数 1–8；每跳都累加吸收与反射损耗。'],
    ['absorptionDbPerHop', '每跳吸收损耗', 'dB', 0.5, 'D/E 层吸收的经验预算项。'],
    ['reflectionLossDbPerHop', '每跳反射/散射损耗', 'dB', 0.5, '电离层与地面反射的合并经验项。'],
    ['foF2MHz', '参考 foF2', 'MHz', 0.1, '用于提示是否需要进一步核对 MUF。']
  ],
  hf_sky_freq: [
    ['virtualHeightKm', '电离层虚高', 'km', 10, '用于球面地球多跳几何。'],
    ['hops', '跳数', '跳', 1, '整数 1–8。'],
    ['verticalAbsorption10MHzDb', '10 MHz 垂直吸收 A₁₀', 'dB/跳', 0.5, '在 10 MHz、垂直入射条件下的标定吸收。'],
    ['reflectionLossDbPerHop', '每跳反射损耗', 'dB', 0.5, '每次电离层/地面反射的经验损耗。'],
    ['foF2MHz', '参考 foF2', 'MHz', 0.1, '用于 MUF/OWF 估算。']
  ],
  hf_mixed: [
    ['groundAttenDbPer100Km', '地波 100 km 附加损耗', 'dB', 0.1, '地波分量的实测标定参数。'],
    ['groundExponent', '地波距离指数 p', '', 0.01, '地波附加损耗随距离增长的指数。'],
    ['virtualHeightKm', '电离层虚高', 'km', 10, '天波分量按单跳球面几何计算。'],
    ['verticalAbsorption10MHzDb', '10 MHz 垂直吸收 A₁₀', 'dB', 0.5, '天波分量的频率相关吸收标定值。'],
    ['reflectionLossDbPerHop', '反射/散射损耗', 'dB', 0.5, '天波分量的单跳经验项。'],
    ['foF2MHz', '参考 foF2', 'MHz', 0.1, '用于天波分量的 MUF/OWF 判断。'],
    ['useSiteGeometry', '启用实测站点高差诊断', '', 1, '额外计算端点高差、路径俯仰角、地球曲率和第一菲涅耳区。', 'checkbox'],
    ['txSiteElevationM', '山腰端站点高度', 'm', 1, '相对统一基准的地面高度。'],
    ['txHeightM', '山腰端天线离地高度', 'm', 0.1, '天线相对当地地面的高度。'],
    ['rxSiteElevationM', '地面端站点高度', 'm', 1, '与山腰端使用同一高度基准。'],
    ['rxHeightM', '地面端天线离地高度', 'm', 0.1, '天线相对当地地面的高度。']
  ],
  manual: [
    ['manualLossDb', '当前距离实测损耗', 'dB', 0.1, '在“当前距离”处的已知路径损耗。'],
    ['manualExponent', '外推损耗指数 n', '', 0.1, '用于把当前实测点向其他距离外推。']
  ]
};

function fieldMarkup([key, label, unit, step, tip, type]) {
  if (type === 'checkbox') {
    return `<label class="check-field"><span><b>${label}</b><small>${tip}</small></span><input data-key="${key}" type="checkbox" ${state[key] ? 'checked' : ''}></label>`;
  }
  return `<label class="field"><span class="field-head"><b>${label}</b><em>${unit}</em></span><input data-key="${key}" type="number" step="${step}" value="${state[key]}"><small>${tip}</small></label>`;
}

function renderModelSelect() {
  const groups = {};
  Object.entries(MODEL_META).forEach(([key, meta]) => (groups[meta.group] ??= []).push([key, meta]));
  $('#model').innerHTML = Object.entries(groups).map(([group, items]) =>
    `<optgroup label="${group}">${items.map(([key, meta]) => `<option value="${key}">${meta.name}</option>`).join('')}</optgroup>`
  ).join('');
  $('#model').value = state.model;
}

function renderFields() {
  $('#common-fields').innerHTML = commonFields.map(fieldMarkup).join('');
  $('#model-fields').innerHTML = (modelFields[state.model] || []).map(fieldMarkup).join('');
  bindInputs();
}

function bindInputs() {
  $$('[data-key]').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.type === 'checkbox') {
        state[input.dataset.key] = input.checked;
      } else {
        // 清空输入框时 Number('') === 0，会把频率等参数静默变成 0 并让损耗算成 NaN，
        // 所以空值必须显式记为 NaN，由 update()/renderChart() 统一按无效参数处理。
        const raw = input.value.trim();
        state[input.dataset.key] = raw === '' ? NaN : Number(raw);
      }
      update();
    });
  });
}

function modelDistanceLimit() {
  if (state.model === 'hf_sky') return Math.min(Math.max(state.plotMaxKm, 100), 40000);
  if (state.model === 'hf_nvis') return Math.min(Math.max(state.plotMaxKm, 100), 1500);
  return Math.min(Math.max(state.plotMaxKm, 1), 10000);
}

function modelSearchLimit() {
  if (['hf_sky','hf_sky_freq'].includes(state.model)) return 40000;
  if (state.model === 'hf_nvis') return 1500;
  if (state.model.startsWith('hf_')) return 5000;
  return 10000;
}

function statusFor(margin) {
  if (margin >= 10) return ['充足', 'good'];
  if (margin >= 0) return ['可用', 'warn'];
  return ['不足', 'bad'];
}

function renderChart(maxLinkDistance) {
  const svg = $('#curve');
  const width = 900, height = 410, pad = { l: 70, r: 34, t: 38, b: 58 };
  const baseMax = modelDistanceLimit();
  const maxD = Math.min(modelSearchLimit(), Math.max(baseMax, Number(state.distanceKm)*1.35, maxLinkDistance ? maxLinkDistance*1.14 : 0));
  const minD = Math.min(0.1, maxD / 1000);
  const count = 180;
  const points = Array.from({ length: count }, (_, i) => {
    const d = minD * ((maxD / minD) ** (i / (count - 1)));
    return { d, y: calculate(state, d).receivedDbm };
  }).filter(p => Number.isFinite(p.y));
  const threshold = calculate(state).effectiveSensitivityDbm;
  const planned = threshold + Number(state.requiredFadeMarginDb);
  // 参数非法（例如频率被清空或填 0）时一个采样点都算不出来。必须在此提前返回，
  // 否则下方模板里的 points.at(-1) 会读取空数组的属性并抛出 TypeError，图表从此停止刷新。
  if (!points.length || !Number.isFinite(threshold) || !Number.isFinite(planned)
    || !Number.isFinite(state.distanceKm)) {
    $('#chart-summary').innerHTML = '<span>参数无效：请确认工作频率与当前距离均为大于 0 的数。</span>';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" class="axis-label">参数无效：无法绘制曲线</text>`;
    return;
  }
  const ys = [...points.map(p => p.y), threshold, planned];
  let yMin = Math.floor((Math.min(...ys) - 8) / 10) * 10;
  let yMax = Math.ceil((Math.max(...ys) + 8) / 10) * 10;
  if (yMax - yMin < 40) { yMin -= 20; yMax += 20; }
  const x = d => pad.l + (Math.log10(d / minD) / Math.log10(maxD / minD)) * (width - pad.l - pad.r);
  const y = v => pad.t + ((yMax - v) / (yMax - yMin)) * (height - pad.t - pad.b);
  const clampY = v => Math.max(pad.t, Math.min(height-pad.b, y(v)));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const xTicks = [];
  for (let pow = Math.ceil(Math.log10(minD)); pow <= Math.floor(Math.log10(maxD)); pow++) {
    const val = 10 ** pow;
    if (val >= minD && val <= maxD) xTicks.push(val);
  }
  if (!xTicks.includes(maxD)) xTicks.push(maxD);
  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + (yMax - yMin) * i / 5);
  const current = calculate(state);
  const cx = x(Math.max(minD, Math.min(maxD, state.distanceKm)));
  const cy = y(current.receivedDbm);
  const mx = maxLinkDistance ? x(Math.max(minD,Math.min(maxD,maxLinkDistance))) : null;
  const currentLabelX = cx > width-230 ? cx-12 : cx+12;
  const currentAnchor = cx > width-230 ? 'end' : 'start';
  const reliableBottom = clampY(planned);
  const thresholdY = clampY(threshold);
  $('#chart-summary').innerHTML = `<span>当前测试点 <b>${nfmt(state.distanceKm,2)} km</b></span><span>接收功率 <b>${nfmt(current.receivedDbm,2)} dBm</b></span><span>设计余量 <b class="${current.designMarginDb >= 0 ? 'positive' : 'negative'}">${nfmt(current.designMarginDb,2)} dB</b></span>${maxLinkDistance ? `<span>门限距离 <b>${nfmt(maxLinkDistance,1)} km</b></span>` : ''}`;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = `
    <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3dd9c5" stop-opacity=".28"/><stop offset="1" stop-color="#3dd9c5" stop-opacity="0"/></linearGradient><filter id="pointGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect x="${pad.l}" y="${pad.t}" width="${width-pad.l-pad.r}" height="${Math.max(0,reliableBottom-pad.t)}" class="zone reliable-zone"/>
    <rect x="${pad.l}" y="${reliableBottom}" width="${width-pad.l-pad.r}" height="${Math.max(0,thresholdY-reliableBottom)}" class="zone marginal-zone"/>
    <rect x="${pad.l}" y="${thresholdY}" width="${width-pad.l-pad.r}" height="${Math.max(0,height-pad.b-thresholdY)}" class="zone outage-zone"/>
    ${yTicks.map(v => `<line x1="${pad.l}" y1="${y(v)}" x2="${width-pad.r}" y2="${y(v)}" class="grid"/><text x="${pad.l-12}" y="${y(v)+4}" text-anchor="end">${nfmt(v,0)}</text>`).join('')}
    ${xTicks.map(v => `<line x1="${x(v)}" y1="${pad.t}" x2="${x(v)}" y2="${height-pad.b}" class="grid vertical"/><text x="${x(v)}" y="${height-pad.b+24}" text-anchor="middle">${v >= 1000 ? nfmt(v/1000,1)+'k' : nfmt(v,1)}</text>`).join('')}
    <path d="${path} L${x(points.at(-1).d)},${height-pad.b} L${x(points[0].d)},${height-pad.b}Z" fill="url(#area)"/>
    <path d="${path}" class="signal"/>
    <line x1="${pad.l}" y1="${y(threshold)}" x2="${width-pad.r}" y2="${y(threshold)}" class="threshold"/>
    <line x1="${pad.l}" y1="${y(planned)}" x2="${width-pad.r}" y2="${y(planned)}" class="planned"/>
    <text x="${width-pad.r-8}" y="${clampY(planned)-7}" text-anchor="end" class="line-label planned-label">设计门限 ${nfmt(planned,1)} dBm</text>
    <text x="${width-pad.r-8}" y="${clampY(threshold)+16}" text-anchor="end" class="line-label threshold-label">解调灵敏度 ${nfmt(threshold,1)} dBm</text>
    <text x="${pad.l+10}" y="${pad.t+18}" class="zone-label reliable-text">可靠区</text>
    ${thresholdY-reliableBottom > 25 ? `<text x="${pad.l+10}" y="${(reliableBottom+thresholdY)/2+4}" class="zone-label marginal-text">衰落风险区</text>` : ''}
    ${height-pad.b-thresholdY > 25 ? `<text x="${pad.l+10}" y="${thresholdY+20}" class="zone-label outage-text">不可用区</text>` : ''}
    ${mx ? `<line x1="${mx}" y1="${pad.t}" x2="${mx}" y2="${height-pad.b}" class="range-marker"/><text x="${mx-7}" y="${pad.t+17}" text-anchor="end" class="range-label">最大 ${nfmt(maxLinkDistance,1)} km</text>` : ''}
    ${Number.isFinite(cy) ? `<circle cx="${cx}" cy="${cy}" r="6" filter="url(#pointGlow)"/><circle cx="${cx}" cy="${cy}" r="14" class="pulse"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${height-pad.b}" class="current-guide"/><text x="${currentLabelX}" y="${cy-15}" text-anchor="${currentAnchor}" class="current-label">${nfmt(state.distanceKm,1)} km · ${nfmt(current.receivedDbm,1)} dBm</text><text x="${currentLabelX}" y="${cy+2}" text-anchor="${currentAnchor}" class="current-margin">余量 ${nfmt(current.designMarginDb,1)} dB</text>` : ''}
    <text x="${width/2}" y="${height-8}" text-anchor="middle" class="axis-label">距离（km，对数轴）</text>
    <text transform="translate(17 ${height/2}) rotate(-90)" text-anchor="middle" class="axis-label">接收功率（dBm）</text>`;
}

function update() {
  const r = calculate(state);
  const searchCapKm = modelSearchLimit();
  const maxD = findMaxDistance(state, searchCapKm);
  const [label, cls] = statusFor(r.designMarginDb);
  $('#status').className = `status ${cls}`;
  $('#status').textContent = label;
  $('#margin').textContent = `${nfmt(r.designMarginDb)} dB`;
  $('#received').textContent = `${nfmt(r.receivedDbm)} dBm`;
  $('#loss').textContent = `${nfmt(r.modelLossDb)} dB`;
  // 撞到搜索上限时用 “≥” 明确标出这是被截断的下界，而不是精确算出的可用距离。
  $('#range').textContent = maxD == null
    ? '未达到'
    : `${maxD >= searchCapKm * 0.999 ? '≥ ' : ''}${nfmt(maxD, maxD < 10 ? 2 : 1)} km`;
  $('#power-w').textContent = `${nfmt(dbmToWatts(state.txPowerDbm), 3)} W`;
  const meta = MODEL_META[state.model];
  $('#model-title').textContent = meta.name;
  $('#model-tag').textContent = meta.tag;
  $('#formula').textContent = meta.formula;
  $('#equations').innerHTML = (meta.equations || [meta.formula]).map((eq, i) => `<div><span>${i + 1}</span><code>${eq}</code></div>`).join('');
  $('#scope').textContent = meta.scope;
  $('#warning-list').innerHTML = validateModel(state).map((w, i) => `<li class="${i === 0 && w.startsWith('参数位于') ? 'ok' : ''}">${w}</li>`).join('');
  const rows = [
    ['发射机输出', state.txPowerDbm, '+'], ['发射馈线损耗', state.txFeedLossDb, '−'],
    ['发射天线增益', state.txGainDbi, '+'], ['模型传播损耗', r.modelLossDb, '−'],
    ['其他固定损耗', state.additionalLossDb, '−'], ['接收天线增益', state.rxGainDbi, '+'],
    ['接收馈线损耗', state.rxFeedLossDb, '−'], ['接收功率', r.receivedDbm, '='],
    [state.useCalculatedSensitivity ? '自动计算灵敏度' : '手动接收灵敏度', r.effectiveSensitivityDbm, '门限'], ['原始链路余量', r.rawMarginDb, '='],
    ['要求衰落余量', state.requiredFadeMarginDb, '−'], ['设计余量', r.designMarginDb, '=']
  ];
  $('#budget-rows').innerHTML = rows.map(([name, value, sign], i) => `<tr class="${i === rows.length-1 ? 'total' : ''}"><td>${name}</td><td>${sign}</td><td>${nfmt(Number(value),2)} dB${name.includes('功率') || name.includes('灵敏度') || name.includes('输出') ? 'm' : ''}</td></tr>`).join('');
  const diagnostics = { bandwidthKhz:state.bandwidthKhz, thermalNoiseDbm:r.thermalNoiseDbm, combinedNoiseFactorDb:r.combinedNoiseFactorDb, noiseFloorDbm:r.noiseFloorDbm, calculatedSensitivityDbm:r.calculatedSensitivityDbm, ...r.details };
  const groups = [
    ['接收与带宽',['bandwidthKhz','thermalNoiseDbm','combinedNoiseFactorDb','noiseFloorDbm','calculatedSensitivityDbm']],
    ['传播损耗',['freeSpaceDb','groundExcessDb','terrainClutterLossDb','ionosphereLossDb','absorptionDb','reflectionTotalDb','groundComponentDb','skyComponentDb','diffractionDb']],
    ['路径几何',['heightDifferenceM','pathElevationAngleDeg','earthBulgeMidM','fresnelMidM','radioHorizonKm','totalSlantKm','slantPerHopKm','surfacePerHopKm','elevationDeg','incidenceDeg','mufMHz','owfMHz','hops','crossoverKm','region','knifeV','referenceLossDb','referenceDistanceKm']]
  ];
  $('#detail-chips').innerHTML = groups.map(([title,keys]) => {
    const items = keys.filter(k => diagnostics[k] !== undefined);
    return items.length ? `<div class="diag-group"><strong>${title}</strong><div>${items.map(k => `<span>${detailLabel(k)} <b>${detailValue(k,diagnostics[k])}</b></span>`).join('')}</div></div>` : '';
  }).join('');
  renderChart(maxD);
}

function detailLabel(k) {
  return ({ bandwidthKhz:'噪声带宽', thermalNoiseDbm:'带内热噪声', combinedNoiseFactorDb:'合并噪声因子', noiseFloorDbm:'总噪声底', calculatedSensitivityDbm:'自动灵敏度', crossoverKm:'交叉距离', region:'当前区间', referenceLossDb:'参考损耗', referenceDistanceKm:'参考距离', freeSpaceDb:'几何/自由空间项', groundExcessDb:'地表附加项', totalSlantKm:'总斜距', slantPerHopKm:'每跳斜距', surfacePerHopKm:'每跳地表距离', elevationDeg:'发射仰角', incidenceDeg:'电离层入射角', hops:'跳数', ionosphereLossDb:'电离层附加项', absorptionDb:'频率相关吸收', reflectionTotalDb:'反射损耗合计', mufMHz:'估算 MUF', owfMHz:'建议 OWF', groundComponentDb:'地波分量损耗', skyComponentDb:'天波分量损耗', radioHorizonKm:'无线电视距', fresnelMidM:'中点第一菲涅耳半径', knifeV:'刀刃参数 ν', diffractionDb:'绕射附加损耗', terrainClutterLossDb:'地形/植被附加损耗', heightDifferenceM:'两端天线绝对高差', pathElevationAngleDeg:'路径俯仰角', earthBulgeMidM:'中点等效地球凸起' })[k] || k;
}
function detailValue(k, v) {
  if (typeof v === 'string') return v;
  if (k === 'hops') return `${v}`;
  if (k === 'elevationDeg' || k === 'incidenceDeg' || k === 'pathElevationAngleDeg') return `${nfmt(v,3)}°`;
  if (k === 'mufMHz' || k === 'owfMHz') return `${nfmt(v,2)} MHz`;
  if (k === 'bandwidthKhz') return `${nfmt(v,2)} kHz`;
  if (k === 'thermalNoiseDbm' || k === 'noiseFloorDbm' || k === 'calculatedSensitivityDbm') return `${nfmt(v,2)} dBm`;
  if (k === 'fresnelMidM' || k === 'heightDifferenceM' || k === 'earthBulgeMidM') return `${nfmt(v,2)} m`;
  if (k === 'knifeV') return nfmt(v,3);
  if (k.endsWith('Km')) return `${nfmt(v,2)} km`;
  return `${nfmt(v,2)} dB`;
}

function applyPreset(name) {
  const actualHF = { ...defaults, model:'hf_ground', txPowerDbm:43.01, distanceKm:25, plotMaxKm:150, txSiteElevationM:200, rxSiteElevationM:0, txHeightM:4.8, rxHeightM:2, useSiteGeometry:true, requiredFadeMarginDb:12 };
  const presets = {
    hf: { ...defaults },
    actual25: { ...actualHF, frequencyMHz:10, bandwidthKhz:24, externalNoiseDb:12, requiredSnrDb:8 },
    hf2: { ...actualHF, frequencyMHz:2, bandwidthKhz:3, externalNoiseDb:22, requiredSnrDb:10 },
    hf4: { ...actualHF, frequencyMHz:4, bandwidthKhz:3, externalNoiseDb:20, requiredSnrDb:10 },
    hf7: { ...actualHF, frequencyMHz:7, bandwidthKhz:3, externalNoiseDb:18, requiredSnrDb:10 },
    hf10: { ...actualHF, frequencyMHz:10, bandwidthKhz:3, externalNoiseDb:16, requiredSnrDb:10 },
    hf15: { ...actualHF, model:'hf_mixed', frequencyMHz:15, bandwidthKhz:3, externalNoiseDb:14, requiredSnrDb:10 },
    hf20: { ...actualHF, model:'hf_mixed', frequencyMHz:20, bandwidthKhz:24, externalNoiseDb:12, requiredSnrDb:8 },
    hf25: { ...actualHF, model:'hf_mixed', frequencyMHz:25, bandwidthKhz:24, externalNoiseDb:10, requiredSnrDb:8 },
    hf29: { ...actualHF, model:'hf_mixed', frequencyMHz:29, bandwidthKhz:24, externalNoiseDb:8, requiredSnrDb:8 },
    // 7.1 MHz 的 NVIS 需要 foF2 约 8 MHz 才不触发 MUF 警告；默认 5.5 MHz 会让预设一打开就报警。
    nvis: { ...defaults, model:'hf_nvis', frequencyMHz:7.1, bandwidthKhz:3, distanceKm:300, plotMaxKm:800, virtualHeightKm:300, absorptionDbPerHop:8, foF2MHz:8, requiredFadeMarginDb:15 },
    sky: { ...defaults, model:'hf_sky_freq', frequencyMHz:12, bandwidthKhz:3, externalNoiseDb:15, distanceKm:1500, plotMaxKm:3000, hops:2, virtualHeightKm:300, requiredFadeMarginDb:18 },
    vhf: { ...defaults, model:'two_ray', txPowerDbm:40, frequencyMHz:70, bandwidthKhz:25, noiseFigureDb:6, externalNoiseDb:3, requiredSnrDb:10, distanceKm:25, plotMaxKm:150, txGainDbi:2.15, rxGainDbi:2.15, txHeightM:15, rxHeightM:2, rxSensitivityDbm:-116, requiredFadeMarginDb:15 },
    portable: { ...defaults, model:'knife_edge', txPowerDbm:37, frequencyMHz:70, bandwidthKhz:25, noiseFigureDb:6, externalNoiseDb:3, requiredSnrDb:10, distanceKm:8, plotMaxKm:40, txGainDbi:0, rxGainDbi:0, txHeightM:1.8, rxHeightM:1.8, obstacleHeightM:3, obstaclePositionFraction:0.5, requiredFadeMarginDb:12 },
    repeater: { ...defaults, model:'egli', txPowerDbm:43, frequencyMHz:150, bandwidthKhz:12.5, noiseFigureDb:5, externalNoiseDb:2, requiredSnrDb:10, distanceKm:50, plotMaxKm:120, txGainDbi:6, rxGainDbi:2.15, txHeightM:60, rxHeightM:2, requiredFadeMarginDb:15 },
    mobile: { ...defaults, model:'hata_suburban', txPowerDbm:43, frequencyMHz:450, bandwidthKhz:12.5, noiseFigureDb:5, externalNoiseDb:2, requiredSnrDb:10, distanceKm:8, plotMaxKm:30, txGainDbi:6, rxGainDbi:0, txHeightM:45, rxHeightM:1.5, rxSensitivityDbm:-110, requiredFadeMarginDb:12 }
  };
  Object.assign(state, presets[name]);
  renderModelSelect(); renderFields(); update();
}

$('#model').addEventListener('change', (e) => { state.model = e.target.value; renderFields(); update(); });
$$('[data-preset]').forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
$('#reset').addEventListener('click', () => applyPreset('hf'));
$('#copy-result').addEventListener('click', async () => {
  const r = calculate(state);
  const text = `射频链路预算｜${MODEL_META[state.model].name}\n频率 ${state.frequencyMHz} MHz｜距离 ${state.distanceKm} km\n接收功率 ${nfmt(r.receivedDbm,2)} dBm｜设计余量 ${nfmt(r.designMarginDb,2)} dB`;
  const button = $('#copy-result');
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '已复制';
  } catch (error) {
    // file:// 或非安全上下文下 Clipboard API 不可用，给出可操作提示而不是静默失败。
    button.textContent = '请手动复制';
  }
  setTimeout(() => button.textContent = '复制结果', 1300);
});

renderModelSelect(); renderFields(); update();
