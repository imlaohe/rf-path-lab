export const MODEL_META = {
  fspl: {
    group: '通用 / 视距', name: '自由空间 FSPL', tag: '基准模型',
    formula: 'L = 32.45 + 20log₁₀(fMHz) + 20log₁₀(dkm)',
    scope: '无遮挡、远场、视距链路。常作为其他模型的基准。',
    equations: ['L_FSPL = 32.45 + 20log₁₀(f_MHz) + 20log₁₀(d_km)']
  },
  log: {
    group: '通用 / 经验', name: '对数距离模型', tag: '可标定',
    formula: 'L = L(d₀) + 10n·log₁₀(d/d₀) + X',
    scope: '室内、园区、城市等有实测标定数据的环境。n 越大，衰减越快。',
    equations: ['L(d) = L(d₀) + 10n·log₁₀(d/d₀) + Xσ']
  },
  two_ray: {
    group: '通用 / 地面', name: '双径地面反射', tag: '远距视距',
    formula: '远区：L = 40log₁₀(d) − 20log₁₀(ht) − 20log₁₀(hr)',
    scope: '平坦地面、天线高度已知、超过交叉距离的视距链路。近区自动回退到 FSPL。',
    equations: ['d_c = 4πh_t h_r / λ', 'L_2ray = 40log₁₀(d_m) − 20log₁₀(h_t) − 20log₁₀(h_r)']
  },
  hata_urban: {
    group: '陆地移动', name: 'Okumura–Hata 城市', tag: '150–1500 MHz',
    formula: 'Hata 城市中值路径损耗',
    scope: '150–1500 MHz、1–20 km；基站 30–200 m，移动台 1–10 m。',
    equations: ['a(h_m) = (1.1log₁₀f − 0.7)h_m − (1.56log₁₀f − 0.8)', 'L_U = 69.55 + 26.16log₁₀f − 13.82log₁₀h_b − a(h_m) + (44.9 − 6.55log₁₀h_b)log₁₀d']
  },
  hata_suburban: {
    group: '陆地移动', name: 'Okumura–Hata 郊区', tag: '150–1500 MHz',
    formula: 'Hata 城市模型 − 郊区修正项',
    scope: 'Hata 适用范围内的低密度建筑区域。',
    equations: ['L_SU = L_U − 2[log₁₀(f/28)]² − 5.4']
  },
  hata_open: {
    group: '陆地移动', name: 'Okumura–Hata 开阔区', tag: '150–1500 MHz',
    formula: 'Hata 城市模型 − 开阔区修正项',
    scope: 'Hata 适用范围内的乡村、开阔区域。',
    equations: ['L_OPEN = L_U − 4.78(log₁₀f)² + 18.33log₁₀f − 40.94']
  },
  cost231: {
    group: '陆地移动', name: 'COST-231 Hata', tag: '1500–2000 MHz',
    formula: 'L = 46.3 + 33.9logf − 13.82loghb − a(hm) + … + C',
    scope: '1500–2000 MHz、1–20 km。可选中等城市或大城市修正。',
    equations: ['L = 46.3 + 33.9log₁₀f − 13.82log₁₀h_b − a(h_m) + (44.9 − 6.55log₁₀h_b)log₁₀d + C_m']
  },
  egli: {
    group: '超短波 VHF', name: 'Egli 地形经验模型', tag: '40–900 MHz',
    formula: '距离、频率与收发天线高度的中值路径损耗',
    scope: '适合不规则地形的 VHF/UHF 工程估算，典型距离大于约 1 mile；天线高度使用 ft。',
    equations: ['L_Egli = 117 + 40log₁₀(d_mile) + 20log₁₀(f_MHz) − 20log₁₀(h_t,ft) − 20log₁₀(h_r,ft)']
  },
  knife_edge: {
    group: '超短波 VHF', name: 'FSPL + 单刀刃绕射', tag: '遮挡路径',
    formula: '自由空间损耗加 Fresnel–Kirchhoff 单刀刃附加损耗',
    scope: '已知一个主要障碍物相对视距线高度和位置时使用；多障碍地形需采用更完整的绕射算法。',
    equations: ['ν = h·√[2(d₁+d₂)/(λd₁d₂)]', 'L_d = 6.9 + 20log₁₀(√[(ν−0.1)²+1] + ν − 0.1)', 'L = L_FSPL + max(0,L_d)']
  },
  vhf_elevated: {
    group: '超短波 VHF', name: '山地高差视距链路', tag: '端点高差',
    formula: 'FSPL + 地形/植被附加损耗，并计算高差几何与菲涅耳区',
    scope: '适合一个站点位于山腰、另一个位于低地的初步视距预算；最终仍需用实际地形剖面检查遮挡。',
    equations: ['ΔH = (H_t + h_t) − (H_r + h_r)', 'θ = arctan(ΔH/d)', 'b_mid = d²/(8kR_e)', 'L = L_FSPL + L_terrain']
  },
  hf_ground_linear: {
    group: '短波 HF', name: 'HF 地波（线性附加衰减）', tag: '实测标定',
    formula: '自由空间损耗 + 每公里附加地表衰减',
    scope: '适合在有限距离范围内用两个以上实测点标定。对距离外推应保持谨慎。',
    equations: ['L_GW = L_FSPL + α_g·d_km']
  },
  hf_ground: {
    group: '短波 HF', name: 'HF 地波（经验衰减）', tag: '工程估算',
    formula: 'L = FSPL + A₁₀₀·(d/100 km)^p',
    scope: '1.5–30 MHz 地波趋势探索。A₁₀₀ 应由地表类型或实测反标；不是 ITU-R P.368 数字曲线复现。',
    equations: ['L_GW = L_FSPL + A₁₀₀·(d/100)^p']
  },
  hf_nvis: {
    group: '短波 HF', name: 'HF NVIS 单跳天波', tag: '近垂直入射',
    formula: '球面地球虚高几何 + 总斜距 FSPL + 吸收/反射损耗',
    scope: '约 30–600 km 的单跳近垂直入射趋势分析；需结合实时 foF2、MUF 与噪声资料判断可用性。',
    equations: ['s = 2√[R² + (R+h′)² − 2R(R+h′)cos(Δ/2)]', 'L = L_FSPL(f,s) + A_D + L_R', 'MUF = foF2 / cos(i)']
  },
  hf_single: {
    group: '短波 HF', name: 'HF 单跳斜射天波', tag: '单跳 F 层',
    formula: '球面地球虚高几何 + 单跳吸收与反射损耗',
    scope: '单跳中距离 HF 链路。虚高、foF2 和吸收损耗应按时段与路径更新。',
    equations: ['s = 2√[R² + (R+h′)² − 2R(R+h′)cos(Δ/2)]', 'L_1hop = L_FSPL(f,s) + A_D + L_R', 'OWF ≈ 0.85·MUF']
  },
  hf_sky: {
    group: '短波 HF', name: 'HF 多跳天波', tag: '1–8 跳',
    formula: '多跳球面几何总斜距 FSPL + 每跳吸收与反射损耗',
    scope: '中远距离 HF 天波方案比较。它不是完整的 ITU-R P.533 或电离层射线追踪实现。',
    equations: ['s_total = N·s_hop(d/N,h′)', 'L_Nhop = L_FSPL(f,s_total) + N(A_D + L_R)']
  },
  hf_sky_freq: {
    group: '短波 HF', name: 'HF 天波（频率相关吸收）', tag: '工程增强',
    formula: '球面多跳几何 + 10 MHz 垂直吸收标定 + 频率平方反比',
    scope: '用于观察低频 D 层吸收和低仰角斜程效应。A₁₀ 应由观测或外部预测结果标定。',
    equations: ['A_D(f,β) = N·A₁₀·(10/f_MHz)² / sinβ', 'L = L_FSPL(f,s_total) + A_D(f,β) + N·L_R']
  },
  hf_mixed: {
    group: '短波 HF', name: 'HF 地波 + 天波功率合成', tag: '过渡区',
    formula: '分别计算地波与天波功率，再按非相干功率相加',
    scope: '用于地波向天波过渡区域的平均功率估算；不模拟两条路径的相干快衰落。',
    equations: ['L_mix = −10log₁₀(10^(−L_GW/10) + 10^(−L_SW/10))', 'L_SW = L_FSPL(f,s) + A_D(f,β) + L_R']
  },
  manual: {
    group: '自定义', name: '已知传播损耗 / 实测标定', tag: '最灵活',
    formula: 'L(d) = Lref + 10n·log₁₀(d/dref)',
    scope: '已有传播损耗、仿真结果或实测点时使用；当前距离作为参考距离。',
    equations: ['L(d) = L_ref + 10n·log₁₀(d/d_ref)']
  }
};

export function dbmToWatts(dbm) {
  return 10 ** ((Number(dbm) - 30) / 10);
}

export function fspl(fMHz, dKm) {
  if (!(fMHz > 0) || !(dKm > 0)) return NaN;
  return 32.45 + 20 * Math.log10(fMHz) + 20 * Math.log10(dKm);
}

export function skyGeometry(distanceKm, virtualHeightKm, hops = 1) {
  const earth = 6371;
  const h = Math.max(1, Number(virtualHeightKm));
  const count = Math.max(1, Math.round(Number(hops)));
  const surfacePerHop = Math.max(0.1, Number(distanceKm)) / count;
  const centralAngle = surfacePerHop / earth;
  const halfSlant = Math.sqrt(
    earth ** 2 + (earth + h) ** 2 - 2 * earth * (earth + h) * Math.cos(centralAngle / 2)
  );
  const slantPerHop = 2 * halfSlant;
  const elevationDeg = Math.atan2(
    (earth + h) * Math.cos(centralAngle / 2) - earth,
    (earth + h) * Math.sin(centralAngle / 2)
  ) * 180 / Math.PI;
  const incidenceCos = Math.min(1, Math.max(0.0001,
    (((earth + h) ** 2) + (halfSlant ** 2) - earth ** 2) / (2 * (earth + h) * halfSlant)
  ));
  const incidenceDeg = Math.acos(incidenceCos) * 180 / Math.PI;
  return {
    totalSlantKm: slantPerHop * count,
    slantPerHopKm: slantPerHop,
    surfacePerHopKm: surfacePerHop,
    elevationDeg,
    incidenceDeg,
    hops: count
  };
}

function hataUrban(fMHz, dKm, baseHeightM, mobileHeightM) {
  const lf = Math.log10(fMHz);
  const hb = Math.max(1, baseHeightM);
  const hm = Math.max(0.2, mobileHeightM);
  const aHm = (1.1 * lf - 0.7) * hm - (1.56 * lf - 0.8);
  return 69.55 + 26.16 * lf - 13.82 * Math.log10(hb) - aHm
    + (44.9 - 6.55 * Math.log10(hb)) * Math.log10(dKm);
}

export function propagationLoss(p, distanceKm = p.distanceKm) {
  const f = Number(p.frequencyMHz);
  const d = Math.max(0.001, Number(distanceKm));
  const ht = Math.max(0.1, Number(p.txHeightM));
  const hr = Math.max(0.1, Number(p.rxHeightM));
  let modelLoss;
  let details = {};

  switch (p.model) {
    case 'log': {
      const d0 = Math.max(0.001, Number(p.referenceDistanceKm || 1));
      modelLoss = fspl(f, d0) + 10 * Number(p.pathExponent) * Math.log10(d / d0)
        + Number(p.shadowLossDb || 0);
      details = { referenceLossDb: fspl(f, d0), referenceDistanceKm: d0 };
      break;
    }
    case 'two_ray': {
      const lambda = 299.792458 / f;
      const crossoverM = 4 * Math.PI * ht * hr / lambda;
      const twoRayLoss = 40 * Math.log10(d * 1000) - 20 * Math.log10(ht) - 20 * Math.log10(hr);
      modelLoss = d * 1000 <= crossoverM ? fspl(f, d) : twoRayLoss;
      details = { crossoverKm: crossoverM / 1000, region: d * 1000 <= crossoverM ? 'FSPL 近区' : '双径远区' };
      break;
    }
    case 'hata_urban':
    case 'hata_suburban':
    case 'hata_open': {
      const urban = hataUrban(f, d, ht, hr);
      if (p.model === 'hata_suburban') {
        modelLoss = urban - 2 * (Math.log10(f / 28) ** 2) - 5.4;
      } else if (p.model === 'hata_open') {
        const lf = Math.log10(f);
        modelLoss = urban - 4.78 * lf ** 2 + 18.33 * lf - 40.94;
      } else {
        modelLoss = urban;
      }
      break;
    }
    case 'cost231': {
      const lf = Math.log10(f);
      const aHm = (1.1 * lf - 0.7) * hr - (1.56 * lf - 0.8);
      const cityCorrection = p.largeCity ? 3 : 0;
      modelLoss = 46.3 + 33.9 * lf - 13.82 * Math.log10(ht) - aHm
        + (44.9 - 6.55 * Math.log10(ht)) * Math.log10(d) + cityCorrection;
      break;
    }
    case 'egli': {
      const miles = d / 1.609344;
      const htFt = ht * 3.28084;
      const hrFt = hr * 3.28084;
      modelLoss = 117 + 40*Math.log10(miles) + 20*Math.log10(f)
        - 20*Math.log10(htFt) - 20*Math.log10(hrFt);
      break;
    }
    case 'knife_edge': {
      const lambdaM = 299.792458 / f;
      const fraction = Math.min(0.95, Math.max(0.05, Number(p.obstaclePositionFraction)));
      const d1M = d * 1000 * fraction;
      const d2M = d * 1000 * (1-fraction);
      const v = Number(p.obstacleHeightM) * Math.sqrt(2*(d1M+d2M)/(lambdaM*d1M*d2M));
      const diffractionDb = v <= -0.7 ? 0 : Math.max(0, 6.9 + 20*Math.log10(Math.sqrt((v-0.1)**2+1)+v-0.1));
      modelLoss = fspl(f,d) + diffractionDb;
      details = { freeSpaceDb:fspl(f,d), knifeV:v, diffractionDb };
      break;
    }
    case 'vhf_elevated': {
      const txTotalM = Number(p.txSiteElevationM) + ht;
      const rxTotalM = Number(p.rxSiteElevationM) + hr;
      const heightDifferenceM = txTotalM-rxTotalM;
      const pathElevationAngleDeg = Math.atan2(Math.abs(heightDifferenceM),d*1000)*180/Math.PI;
      const effectiveEarthRadiusM = (4/3)*6371000;
      const earthBulgeMidM = ((d*1000/2)**2)/(2*effectiveEarthRadiusM);
      modelLoss = fspl(f,d) + Number(p.terrainClutterLossDb);
      details = { freeSpaceDb:fspl(f,d), terrainClutterLossDb:Number(p.terrainClutterLossDb), heightDifferenceM, pathElevationAngleDeg, earthBulgeMidM };
      break;
    }
    case 'hf_ground_linear': {
      const excess = Number(p.groundLinearDbPerKm) * d;
      modelLoss = fspl(f, d) + excess;
      details = { freeSpaceDb: fspl(f, d), groundExcessDb: excess };
      break;
    }
    case 'hf_ground': {
      const excess = Number(p.groundAttenDbPer100Km) * ((d / 100) ** Number(p.groundExponent));
      modelLoss = fspl(f, d) + excess;
      details = { freeSpaceDb: fspl(f, d), groundExcessDb: excess };
      break;
    }
    case 'hf_nvis':
    case 'hf_single':
    case 'hf_sky': {
      const hops = (p.model === 'hf_nvis' || p.model === 'hf_single') ? 1 : Number(p.hops);
      const geometry = skyGeometry(d, Number(p.virtualHeightKm), hops);
      const hopLoss = geometry.hops * (Number(p.absorptionDbPerHop) + Number(p.reflectionLossDbPerHop));
      modelLoss = fspl(f, geometry.totalSlantKm) + hopLoss;
      const mufMHz = Number(p.foF2MHz) / Math.cos(geometry.incidenceDeg * Math.PI / 180);
      details = { ...geometry, freeSpaceDb: fspl(f, geometry.totalSlantKm), ionosphereLossDb: hopLoss, mufMHz, owfMHz:0.85*mufMHz };
      break;
    }
    case 'hf_sky_freq': {
      const geometry = skyGeometry(d, Number(p.virtualHeightKm), Number(p.hops));
      const sinElevation = Math.max(0.15, Math.sin(geometry.elevationDeg * Math.PI / 180));
      const absorption = geometry.hops * Number(p.verticalAbsorption10MHzDb) * ((10 / f) ** 2) / sinElevation;
      const reflection = geometry.hops * Number(p.reflectionLossDbPerHop);
      modelLoss = fspl(f, geometry.totalSlantKm) + absorption + reflection;
      const mufMHz = Number(p.foF2MHz) / Math.cos(geometry.incidenceDeg * Math.PI / 180);
      details = { ...geometry, freeSpaceDb:fspl(f,geometry.totalSlantKm), absorptionDb:absorption, reflectionTotalDb:reflection, mufMHz, owfMHz:0.85*mufMHz };
      break;
    }
    case 'hf_mixed': {
      const groundExcess = Number(p.groundAttenDbPer100Km) * ((d / 100) ** Number(p.groundExponent));
      const groundLoss = fspl(f,d) + groundExcess;
      const geometry = skyGeometry(d, Number(p.virtualHeightKm), 1);
      const sinElevation = Math.max(0.15, Math.sin(geometry.elevationDeg * Math.PI / 180));
      const absorption = Number(p.verticalAbsorption10MHzDb) * ((10 / f) ** 2) / sinElevation;
      const skyLoss = fspl(f,geometry.totalSlantKm) + absorption + Number(p.reflectionLossDbPerHop);
      modelLoss = -10 * Math.log10((10 ** (-groundLoss/10)) + (10 ** (-skyLoss/10)));
      const mufMHz = Number(p.foF2MHz) / Math.cos(geometry.incidenceDeg * Math.PI / 180);
      details = { ...geometry, groundComponentDb:groundLoss, skyComponentDb:skyLoss, absorptionDb:absorption, mufMHz, owfMHz:0.85*mufMHz };
      break;
    }
    case 'manual': {
      const dRef = Math.max(0.001, Number(p.distanceKm));
      modelLoss = Number(p.manualLossDb) + 10 * Number(p.manualExponent) * Math.log10(d / dRef);
      details = { referenceDistanceKm: dRef, referenceLossDb: Number(p.manualLossDb) };
      break;
    }
    case 'fspl':
    default:
      modelLoss = fspl(f, d);
  }
  if (f >= 30 && f <= 300) {
    let horizonHtM = ht;
    let horizonHrM = hr;
    if (p.model === 'vhf_elevated') {
      const delta = Number(p.txSiteElevationM)-Number(p.rxSiteElevationM);
      horizonHtM += Math.max(0,delta);
      horizonHrM += Math.max(0,-delta);
    }
    const horizonKm = 3.57 * (Math.sqrt(horizonHtM) + Math.sqrt(horizonHrM));
    const lambdaM = 299.792458 / f;
    const dM = d * 1000;
    const fresnelMidM = Math.sqrt(lambdaM * (dM/2) * (dM/2) / dM);
    details = { ...details, radioHorizonKm:horizonKm, fresnelMidM };
  }
  if (p.useSiteGeometry) {
    const txTotalM = Number(p.txSiteElevationM) + ht;
    const rxTotalM = Number(p.rxSiteElevationM) + hr;
    const heightDifferenceM = txTotalM-rxTotalM;
    const pathElevationAngleDeg = Math.atan2(Math.abs(heightDifferenceM),d*1000)*180/Math.PI;
    const effectiveEarthRadiusM = (4/3)*6371000;
    const earthBulgeMidM = ((d*1000/2)**2)/(2*effectiveEarthRadiusM);
    const lambdaM = 299.792458/f;
    const fresnelMidM = Math.sqrt(lambdaM*(d*1000/2)*(d*1000/2)/(d*1000));
    details = { ...details, heightDifferenceM, pathElevationAngleDeg, earthBulgeMidM, fresnelMidM };
  }
  return { modelLossDb: modelLoss, details };
}

export function receiverNoise(p) {
  const bandwidthHz = Math.max(1, Number(p.bandwidthKhz ?? 24) * 1000);
  const noiseFigureDb = Number(p.noiseFigureDb ?? 6);
  const externalNoiseDb = Number(p.externalNoiseDb ?? 0);
  const receiverFactor = 10 ** (noiseFigureDb/10);
  const externalFactor = 10 ** (externalNoiseDb/10);
  const combinedNoiseFactorDb = 10 * Math.log10(Math.max(1, receiverFactor + externalFactor - 1));
  const thermalNoiseDbm = -174 + 10*Math.log10(bandwidthHz);
  const noiseFloorDbm = thermalNoiseDbm + combinedNoiseFactorDb;
  const calculatedSensitivityDbm = noiseFloorDbm + Number(p.requiredSnrDb ?? 10) + Number(p.implementationMarginDb ?? 2);
  return { bandwidthHz, thermalNoiseDbm, combinedNoiseFactorDb, noiseFloorDbm, calculatedSensitivityDbm };
}

export function calculate(p, distanceKm = p.distanceKm) {
  const prop = propagationLoss(p, distanceKm);
  const noise = receiverNoise(p);
  const effectiveSensitivityDbm = p.useCalculatedSensitivity ? noise.calculatedSensitivityDbm : Number(p.rxSensitivityDbm);
  const eirpDbm = Number(p.txPowerDbm) - Number(p.txFeedLossDb) + Number(p.txGainDbi);
  const receivedDbm = eirpDbm - prop.modelLossDb - Number(p.additionalLossDb)
    + Number(p.rxGainDbi) - Number(p.rxFeedLossDb);
  const rawMarginDb = receivedDbm - effectiveSensitivityDbm;
  const designMarginDb = rawMarginDb - Number(p.requiredFadeMarginDb);
  return {
    ...prop,
    distanceKm: Number(distanceKm),
    eirpDbm,
    receivedDbm,
    rawMarginDb,
    designMarginDb,
    totalLossDb: Number(p.txFeedLossDb) + prop.modelLossDb + Number(p.additionalLossDb) + Number(p.rxFeedLossDb)
    ,...noise,
    effectiveSensitivityDbm
  };
}

export function findMaxDistance(p, limitKm) {
  const min = 0.05;
  const max = Math.max(min * 2, Number(limitKm));
  const steps = 1800;
  let farthest = null;
  for (let i = 0; i <= steps; i += 1) {
    const d = min * ((max / min) ** (i / steps));
    const r = calculate(p, d);
    if (Number.isFinite(r.designMarginDb) && r.designMarginDb >= 0) farthest = d;
  }
  return farthest;
}

export function validateModel(p) {
  const warnings = [];
  const f = Number(p.frequencyMHz);
  const d = Number(p.distanceKm);
  if (!(f > 0) || !(d > 0)) warnings.push('频率和距离必须大于 0。');
  if (p.model.startsWith('hata_') && (f < 150 || f > 1500 || d < 1 || d > 20)) {
    warnings.push('当前参数超出 Hata 的典型范围（150–1500 MHz、1–20 km）。');
  }
  if (p.model.startsWith('hata_') && (p.txHeightM < 30 || p.txHeightM > 200 || p.rxHeightM < 1 || p.rxHeightM > 10)) {
    warnings.push('当前天线高度超出 Hata 的典型范围（基站 30–200 m、移动台 1–10 m）。');
  }
  if (p.model === 'cost231' && (f < 1500 || f > 2000 || d < 1 || d > 20)) {
    warnings.push('当前参数超出 COST-231 Hata 的典型范围（1500–2000 MHz、1–20 km）。');
  }
  if (p.model === 'egli' && (f < 40 || f > 900 || d < 1.6)) {
    warnings.push('当前参数超出 Egli 的常用范围（40–900 MHz，距离通常大于约 1 mile）。');
  }
  if (p.model === 'vhf_elevated' && (f < 30 || f > 300)) {
    warnings.push('山地高差视距预设按 VHF（30–300 MHz）优化；超出该频段请复核模型。');
  }
  if (f >= 30 && f <= 300) {
    let h1=Math.max(0.1,Number(p.txHeightM)), h2=Math.max(0.1,Number(p.rxHeightM));
    if (p.model === 'vhf_elevated') {
      const delta=Number(p.txSiteElevationM)-Number(p.rxSiteElevationM);
      h1+=Math.max(0,delta); h2+=Math.max(0,-delta);
    }
    const horizon = 3.57*(Math.sqrt(h1)+Math.sqrt(h2));
    if (d > horizon) warnings.push(`距离超过几何无线电视距（约 ${horizon.toFixed(1)} km），应考虑绕射、折射或中继。`);
  }
  if (p.model.startsWith('hf_') && (f < 1.5 || f > 30)) {
    warnings.push('短波模型建议在 1.5–30 MHz 内使用。');
  }
  if (p.model === 'hf_nvis' && (d < 30 || d > 600)) {
    warnings.push('NVIS 常用于约 30–600 km；当前距离仅作几何趋势参考。');
  }
  if (['hf_nvis','hf_single','hf_sky','hf_sky_freq','hf_mixed'].includes(p.model)) {
    const hops = ['hf_nvis','hf_single','hf_mixed'].includes(p.model) ? 1 : Number(p.hops);
    const g = skyGeometry(d, Number(p.virtualHeightKm), hops);
    const muf = Number(p.foF2MHz) / Math.cos(g.incidenceDeg * Math.PI / 180);
    if (f > muf) warnings.push(`工作频率高于几何估算 MUF（${muf.toFixed(2)} MHz），该天波模式可能无法建立。`);
    else if (f > 0.85*muf) warnings.push(`工作频率高于建议 OWF（约 ${(0.85*muf).toFixed(2)} MHz），链路对电离层变化较敏感。`);
  }
  if (!warnings.length) warnings.push('参数位于该模型的常用工程范围内。');
  return warnings;
}
