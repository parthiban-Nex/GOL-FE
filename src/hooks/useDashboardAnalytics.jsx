import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dashboardApi } from "@/services";
import { showToast } from "@/utils/toast";


const LABEL_KEYS = ["period", "label", "month", "name", "bucket", "source"];
const VALUE_KEYS = ["amount", "value", "total", "count", "qty", "totalAmount"];


const EPRO_TYPE_PAYLOAD = { Mech: "RJC", Body: "AJC" };

const VEHICLE_FLOW_PAYLOAD = { Inflow: "inflow", Outflow: "outflow" };


function pick(row, keys) {
  if (!row || typeof row !== "object") return undefined;
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function pickSeries(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return {
    labels: list.map((row) => String(pick(row, LABEL_KEYS) ?? "")),
    values: list.map((row) => Number(pick(row, VALUE_KEYS) ?? 0)),
  };
}

export function useDashboardAnalytics({ option = "monthly" } = {}) {
  const [data, setData] = useState({
    summary: null,
    ajcRjc: null,
    inventory: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);

    const calls = [
      ["summary", () => dashboardApi.summary()],
      // ["ajcRjc", () => dashboardApi.ajcRjc({ option })],
      ["inventory", () => dashboardApi.inventoryStock()],
    ];

    const results = await Promise.allSettled(calls.map(([, fn]) => fn()));

    const next = {};
    results.forEach((result, i) => {
      const [key] = calls[i];
      if (result.status !== "fulfilled") {
        next[key] = null;
        return;
      }
      const body = result.value ?? {};
      next[key] = body.dashboard ?? body.data ?? null;
    });
    setData(next);

    if (results.every((r) => r.status === "rejected")) {
      showToast.error("Couldn't load dashboard analytics.");
    }

    setIsLoading(false);
  }, [option]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Source types (Vehicles filter dropdown) - fetched once ── */
  const [sourceTypes, setSourceTypes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .sourceTypes()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.sourceTypeData)
          ? res.sourceTypeData
          : [];
        setSourceTypes(list.filter((s) => s.status));
      })
      .catch(() => {
        if (!cancelled) setSourceTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceTypeOptions = useMemo(
    () =>
      sourceTypes.map((s) => ({
        value: String(s.id),
        label: String(s.sourceTypeName ?? "").trim(),
      })),
    [sourceTypes],
  );

  /* ── Revenue cards (Section 2) - shared, no filter, unchanged ── */
  const [revenueRaw, setRevenueRaw] = useState(null);
  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .revenue()
      .then((res) => {
        if (!cancelled) setRevenueRaw(res?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setRevenueRaw(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const revenueCards = useMemo(() => {
    const r = revenueRaw;
    if (!r) return null;
    return {
      salesTurnover: {
        mtd: toLakhs(r.totalSalesMTD),
        ytd: toLakhs(r.totalSalesYTD),
      },
      mechShopPerformance: {
        mtd: toLakhs(r.totalMechMTD),
        ytd: toLakhs(r.totalMechYTD),
      },
      bodyShopPerformance: {
        mtd: toLakhs(r.totalBodyMTD),
        ytd: toLakhs(r.totalBodyYTD),
      },
    };
  }, [revenueRaw]);

  const outletName = revenueRaw?.outletName ?? null;

  /* ── EPRO Trend - own effect, Mech/Body + Monthly/Weekly ── */
  const [eproShopType, setEproShopType] = useState("Mech");
  const [eproOption, setEproOption] = useState("monthly");
  const [eproRaw, setEproRaw] = useState(null);
  const [isEproLoading, setIsEproLoading] = useState(true);

  const loadEproTrend = useCallback(async () => {
    setIsEproLoading(true);
    try {
      const res = await dashboardApi.eproTrend({
        option: eproOption,
        type: EPRO_TYPE_PAYLOAD[eproShopType] ?? "RJC",
      });
      setEproRaw(res?.data ?? null);
    } catch {
      setEproRaw(null);
    } finally {
      setIsEproLoading(false);
    }
  }, [eproShopType, eproOption]);

  useEffect(() => {
    loadEproTrend();
  }, [loadEproTrend]);

  const eproSeries = useMemo(() => {
    const { labels, values } = pickSeries(eproRaw);
    if (!values.length) return { labels: [], values: [], highlight: null };
    const peak = values.reduce(
      (best, v, i) => (v > values[best] ? i : best),
      0,
    );
    return {
      labels,
      values,
      highlight: { month: labels[peak], value: formatCompact(values[peak]) },
    };
  }, [eproRaw]);

  /* ── Vehicles - own effect, source + Inflow/Outflow + Day/Week/Month ── */
  const [vehicleSourceTypeId, setVehicleSourceTypeId] = useState("");
  const [vehicleFlowDirection, setVehicleFlowDirection] = useState("Inflow");
  const [vehiclePeriod, setVehiclePeriod] = useState("monthly");
  const [vehicleFlowRaw, setVehicleFlowRaw] = useState(null);
  const [isVehicleFlowLoading, setIsVehicleFlowLoading] = useState(true);

  const loadVehicleFlow = useCallback(async () => {
    setIsVehicleFlowLoading(true);
    try {
      const res = await dashboardApi.vehicleFlow({
        option: vehiclePeriod,
        sourceTypeId: vehicleSourceTypeId,
        flow: VEHICLE_FLOW_PAYLOAD[vehicleFlowDirection] ?? "inflow",
      });
      setVehicleFlowRaw(res?.dashboardVehicleMetrics ?? null);
    } catch {
      setVehicleFlowRaw(null);
    } finally {
      setIsVehicleFlowLoading(false);
    }
  }, [vehicleSourceTypeId, vehicleFlowDirection, vehiclePeriod]);

  useEffect(() => {
    loadVehicleFlow();
  }, [loadVehicleFlow]);

  const vehicleFlow = useMemo(() => {
    const rows = Array.isArray(vehicleFlowRaw) ? vehicleFlowRaw : [];
    if (!rows.length) return null;
    return {
      labels: rows.map((r) => String(r.period ?? "")),
      mech: rows.map((r) => Number(r.mech ?? 0)),
      body: rows.map((r) => Number(r.body ?? 0)),
    };
  }, [vehicleFlowRaw]);


  const [mechBodyOption, setMechBodyOption] = useState("monthly");
  const [mechBodyRaw, setMechBodyRaw] = useState(null);
  const [isMechBodyLoading, setIsMechBodyLoading] = useState(true);

  const loadMechBody = useCallback(async () => {
    setIsMechBodyLoading(true);
    try {
      const res = await dashboardApi.ajcRjc({
        option: mechBodyOption,
      });
      setMechBodyRaw(res?.data ?? null);
    } catch {
      setMechBodyRaw(null);
    } finally {
      setIsMechBodyLoading(false);
    }
  }, [mechBodyOption]);

  useEffect(() => {
    loadMechBody();
  }, [loadMechBody]);

  const mechBody = useMemo(() => {
    const r = mechBodyRaw;
    if (!r) return null;
    return {
      mtd: [Number(r.totalMechMTD ?? 0), Number(r.totalBodyMTD ?? 0)],
      ytd: [Number(r.totalMechYTD ?? 0), Number(r.totalBodyYTD ?? 0)],
    };
  }, [mechBodyRaw]);

  /* ── Labour/Parts - own effect, Monthly/Weekly ── */
  const [labourPartsOption, setLabourPartsOption] = useState("monthly");
  const [labourPartsRaw, setLabourPartsRaw] = useState(null);
  const [isLabourPartsLoading, setIsLabourPartsLoading] = useState(true);

  const loadLabourParts = useCallback(async () => {
    setIsLabourPartsLoading(true);
    try {
      const res = await dashboardApi.labourParts({
        option: labourPartsOption,
      });
      setLabourPartsRaw(res?.data ?? null);
    } catch {
      setLabourPartsRaw(null);
    } finally {
      setIsLabourPartsLoading(false);
    }
  }, [labourPartsOption]);

  useEffect(() => {
    loadLabourParts();
  }, [loadLabourParts]);

  const labourPartsSeries = useMemo(() => {
    const rows = Array.isArray(labourPartsRaw) ? labourPartsRaw : [];
    if (!rows.length) return null;
    return {
      labels: rows.map((r) => String(r.period ?? "")),
      labour: rows.map((r) => Number(r.labour ?? 0)),
      parts: rows.map((r) => Number(r.parts ?? 0)),
    };
  }, [labourPartsRaw]);

  const labourPartsTotals = useMemo(() => {
    const s = data.summary;
    if (!s) return null;
    return {
      labour:
        Number(s.totalBillLabAmountWithoutTaxRJC ?? 0) +
        Number(s.totalBillLabAmountWithoutTaxAJC ?? 0),
      parts:
        Number(s.totalBillPartAmountWithoutTaxRJC ?? 0) +
        Number(s.totalBillPartAmountWithoutTaxAJC ?? 0),
    };
  }, [data.summary]);

  /* ── New Vs Repeat - own effect, Monthly/Weekly ── */
  const [newVsRepeatOption, setNewVsRepeatOption] = useState("monthly");
  const [customerSummaryRaw, setCustomerSummaryRaw] = useState(null);
  const [isNewVsRepeatLoading, setIsNewVsRepeatLoading] = useState(true);

  const loadCustomerSummary = useCallback(async () => {
    setIsNewVsRepeatLoading(true);
    try {
      const res = await dashboardApi.customerSummary({
        option: newVsRepeatOption,
      });
      setCustomerSummaryRaw(res?.data ?? null);
    } catch {
      setCustomerSummaryRaw(null);
    } finally {
      setIsNewVsRepeatLoading(false);
    }
  }, [newVsRepeatOption]);

  useEffect(() => {
    loadCustomerSummary();
  }, [loadCustomerSummary]);

  const newVsRepeat = useMemo(() => {
    const rows = Array.isArray(customerSummaryRaw) ? customerSummaryRaw : [];
    if (!rows.length) return null;
    const find = (label) =>
      rows.find((r) => String(r.name).toLowerCase() === label)?.value;
    return {
      newCount: Number(find("new") ?? 0),
      repeatCount: Number(find("repeat") ?? 0),
    };
  }, [customerSummaryRaw]);

  /* ── Purchase from myTVS - own effect, Monthly/Weekly ── */
  const [purchaseOption, setPurchaseOption] = useState("monthly");
  const [purchaseRaw, setPurchaseRaw] = useState(null);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(true);

  const loadPurchase = useCallback(async () => {
    setIsPurchaseLoading(true);
    try {
      const res = await dashboardApi.purchaseFromMytvs({
         option: purchaseOption,
      });
      setPurchaseRaw(res?.data ?? null);
    } catch {
      setPurchaseRaw(null);
    } finally {
      setIsPurchaseLoading(false);
    }
  }, [purchaseOption]);

  useEffect(() => {
    loadPurchase();
  }, [loadPurchase]);

  const purchaseTrend = useMemo(() => {
    const { labels, values } = pickSeries(purchaseRaw);
    if (!values.length) return { labels: [], values: [], highlight: null };
    const peak = values.reduce(
      (best, v, i) => (v > values[best] ? i : best),
      0,
    );
    return {
      labels,
      values,
      highlight: { month: labels[peak], value: formatCompact(values[peak]) },
    };
  }, [purchaseRaw]);

  /* ── Unchanged ── */
  const wipRfb = useMemo(() => {
    const s = data.summary;
    if (!s) return null;
    return {
      wip: {
        count: s.totalWipCount ?? 0,
        amount: formatCurrency(s.totalWipWithTax),
      },
      rfb: {
        count: s.totalBillCount ?? 0,
        amount: formatCurrency(s.totalBillAmountWithTax),
      },
    };
  }, [data.summary]);

  const inventory = useMemo(() => {
    const rows = Array.isArray(data.inventory?.ageBuckets)
      ? data.inventory.ageBuckets
      : [];
    if (!rows.length) return null;
    const buckets = rows.map((row) => ({
      label: row.age_bucket,
      count: Number(row.total_count ?? 0),
      value: Number(row.total_price ?? 0),
    }));
    return {
      buckets,
      summary: {
        totalCount: Number(
          data.inventory?.totals?.total_count ??
            buckets.reduce((s, b) => s + b.count, 0),
        ),
        totalValue: Number(
          data.inventory?.totals?.total_price ??
            buckets.reduce((s, b) => s + b.value, 0),
        ),
      },
    };
  }, [data.inventory]);

  return {
    isLoading,
    raw: data,
    summary: data.summary,
    outletName,
    revenueCards,
    wipRfb,
    inventory,

    eproSeries,
    eproShopType,
    setEproShopType,
    eproOption,
    setEproOption,
    isEproLoading,

    vehicleFlow,
    sourceTypeOptions,
    vehicleSourceTypeId,
    setVehicleSourceTypeId,
    vehicleFlowDirection,
    setVehicleFlowDirection,
    vehiclePeriod,
    setVehiclePeriod,
    isVehicleFlowLoading,

    mechBody,
    mechBodyOption,
    setMechBodyOption,
    isMechBodyLoading,

    labourPartsSeries,
    labourPartsTotals,
    labourPartsOption,
    setLabourPartsOption,
    isLabourPartsLoading,

    newVsRepeat,
    newVsRepeatOption,
    setNewVsRepeatOption,
    isNewVsRepeatLoading,

    purchaseTrend,
    purchaseOption,
    setPurchaseOption,
    isPurchaseLoading,

    refetch: load,
  };
}

const DashboardAnalyticsContext = createContext(null);

export function DashboardAnalyticsProvider({ option = "monthly", children }) {
  const value = useDashboardAnalytics({ option });
  return (
    <DashboardAnalyticsContext.Provider value={value}>
      {children}
    </DashboardAnalyticsContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardAnalyticsContext);
  if (!context) {
    throw new Error(
      "useDashboardData must be used inside <DashboardAnalyticsProvider>"
    );
  }
  return context;
}

export function toLakhs(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return (number / 100000).toFixed(2);
}

export function formatCompact(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return "0";
  const abs = Math.abs(number);
  if (abs >= 10000000) return `${(number / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${(number / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(Math.round(number));
}

export function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `₹${formatCompact(number)}`;
}
