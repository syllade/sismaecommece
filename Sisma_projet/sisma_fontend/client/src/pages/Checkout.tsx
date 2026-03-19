import { useCart } from "@/hooks/use-cart";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Loader2,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  ClipboardList,
  Check,
} from "lucide-react";
import { useProduct } from "@/hooks/use-products";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { abidjanLocations, communes, getQuartiers } from "@/data/abidjan-locations";
import { Link } from "wouter";
import type { CartItem } from "@/hooks/use-cart";
import type { CreateOrderRequest } from "@shared/schema";
import { buildApiUrl } from "@/lib/apiConfig";
import { recordConversion } from "@/hooks/use-sponsored";
import { useAuth } from "@/context/ClientAuthContext";
import {
  getCustomerProfileByPhone,
  getLastCustomerPhone,
  normalizePhone,
  saveCustomerProfile,
  saveSignupPrefill,
  setLastCustomerPhone,
  setGuestOrderPlaced,
} from "@/lib/customerProfile";
import type { CustomerProfile } from "@/lib/customerProfile";
import { getMemberProfile, recordCompletedOrder, saveMemberProfile } from "@/lib/client-account";

const formSchema = z.object({
  customerName: z.string().min(2, "Nom complet requis"),
  customerPhone: z.string().min(10, "Téléphone invalide"),
  customerEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  commune: z.string().min(1, "Commune obligatoire"),
  quartier: z.string().optional(),
  repère: z.string().optional(),
  customerLocation: z.string().optional(),
  deliveryType: z.enum(["immediate", "scheduled", "programmed"]),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { mutate, isPending } = useCreateOrder();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = typeof window !== "undefined" ? window.location.search : "";
  const [selectedCommune, setSelectedCommune] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number>(2000);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);
  const [lastPrefillPhone, setLastPrefillPhone] = useState<string>("");

  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const isDirect = params.get("direct") === "1";
  const directProductId = params.get("productId");
  const directQty = Math.max(1, parseInt(params.get("qty") || "1", 10));
  const directColor = params.get("color") || undefined;
  const directSize = params.get("size") || undefined;

  const { data: directProduct, isLoading: directProductLoading } = useProduct(
    isDirect && directProductId ? String(directProductId) : ""
  );

  const displayItems = useMemo(() => {
    if (isDirect && directProduct && directProductId) {
      const price =
        (directProduct as any).discountedPrice ??
        ((directProduct as any).discount
          ? Math.round(directProduct.price * (1 - ((directProduct as any).discount || 0) / 100))
          : directProduct.price);
      return [
        {
          ...directProduct,
          id: directProduct.id,
          name: directProduct.name,
          price: directProduct.price,
          quantity: directQty,
          ...(directColor && { color: directColor }),
          ...(directSize && { size: directSize }),
          discountedPrice: price !== directProduct.price ? price : undefined,
        } as CartItem,
      ];
    }
    return items;
  }, [isDirect, directProduct, directProductId, directQty, directColor, directSize, items]);

  const totalDisplay = useMemo(
    () =>
      displayItems.reduce((sum, item) => {
        const p = (item as CartItem & { discountedPrice?: number }).discountedPrice ?? item.price;
        return sum + p * item.quantity;
      }, 0),
    [displayItems]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      commune: "",
      quartier: "",
      repère: "",
      customerLocation: "",
      deliveryType: "immediate",
      deliveryDate: "",
      notes: "",
    },
  });

  const applyProfile = (profile: CustomerProfile, force = false) => {
    const current = form.getValues();
    const apply = (key: keyof FormValues, value?: string | null) => {
      if (!value) return;
      const currentValue = current[key];
      if (!force && currentValue) return;
      form.setValue(key, value as any, { shouldValidate: false });
    };

    apply("customerName", profile.name);
    apply("customerPhone", profile.phone);
    apply("customerEmail", profile.email ?? "");
    apply("commune", profile.commune ?? "");
    apply("quartier", profile.quartier ?? "");
    apply("repère", profile.repere ?? "");
    apply("customerLocation", profile.customerLocation ?? "");
  };

  const quartiers = useMemo(
    () => (selectedCommune ? getQuartiers(selectedCommune) : []),
    [selectedCommune]
  );
  const hasQuartiers = quartiers.length > 0;
  const selectedQuartier = form.watch("quartier");
  const watchedCommune = form.watch("commune");
  const watchedPhone = form.watch("customerPhone");

  useEffect(() => {
    if (watchedCommune !== selectedCommune) {
      setSelectedCommune(watchedCommune || "");
      form.setValue("quartier", "", { shouldValidate: false });
    }
  }, [watchedCommune, selectedCommune, form]);

  useEffect(() => {
    if (!token) return;
    const memberProfile = getMemberProfile();
    if (!memberProfile) return;
    applyProfile(memberProfile, false);
    setPrefillNotice("Vos informations membre sont prêtes pour une commande rapide.");
    if (memberProfile.phone) {
      setLastPrefillPhone(normalizePhone(memberProfile.phone));
    }
  }, [token, form]);

  useEffect(() => {
    const lastPhone = getLastCustomerPhone();
    if (!lastPhone) return;
    const profile = getCustomerProfileByPhone(lastPhone);
    if (!profile) return;
    applyProfile(profile, false);
    setPrefillNotice(profile.name ? `Informations pré-remplies pour ${profile.name}.` : "Informations pré-remplies.");
  }, [form]);

  useEffect(() => {
    const normalized = normalizePhone(watchedPhone || "");
    if (!normalized || normalized.length < 8) {
      setPrefillNotice(null);
      return;
    }
    if (normalized === lastPrefillPhone) return;
    const profile = getCustomerProfileByPhone(normalized);
    if (!profile) {
      setPrefillNotice(null);
      return;
    }
    applyProfile(profile, false);
    setLastPrefillPhone(normalized);
    setPrefillNotice(profile.name ? `Informations retrouvées pour ${profile.name}.` : "Informations retrouvées.");
  }, [watchedPhone, lastPrefillPhone]);

  useEffect(() => {
    let active = true;
    if (!selectedCommune) {
      setDeliveryFee(2000);
      setIsCalculatingFee(false);
      return () => {
        active = false;
      };
    }

    const fetchDeliveryFee = async () => {
      try {
        setIsCalculatingFee(true);
        const search = new URLSearchParams({ commune: selectedCommune });
        if (selectedQuartier) search.set("quartier", selectedQuartier);

        const res = await fetch(buildApiUrl(`/delivery-fees/calculate?${search.toString()}`));
        const payload = await res.json().catch(() => null);
        const fee = Number(payload?.fee);

        if (active) {
          setDeliveryFee(Number.isFinite(fee) ? fee : 2000);
        }
      } catch {
        if (active) setDeliveryFee(2000);
      } finally {
        if (active) setIsCalculatingFee(false);
      }
    };

    fetchDeliveryFee();

    return () => {
      active = false;
    };
  }, [selectedCommune, selectedQuartier]);

  const onSubmit = (data: FormValues) => {
    if (displayItems.length === 0) return;
    const deliveryType = data.deliveryType === "programmed" ? "scheduled" : data.deliveryType;
    let fullLocation = "";
    if (data.commune) {
      fullLocation = `Abidjan, ${data.commune}`;
      if (data.quartier) fullLocation += `, ${data.quartier}`;
      if (data.repère) fullLocation += `, ${data.repère}`;
    } else {
      fullLocation = data.customerLocation ?? "";
    }

    const orderData = {
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail?.trim() || null,
      customer_location: fullLocation,
      commune: data.commune || null,
      quartier: data.quartier || null,
      delivery_type: deliveryType,
      delivery_date: data.deliveryDate || null,
      delivery_fee: deliveryFee,
      notes: data.notes || null,
      items: displayItems.map((item: { id: number; quantity: number; color?: string; size?: string }) => ({
        product_id: item.id,
        quantity: item.quantity,
        ...(item.color != null && { color: item.color }),
        ...(item.size != null && { size: item.size }),
      })),
    };

    const profileSnapshot: CustomerProfile = {
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail?.trim() || null,
      commune: data.commune || null,
      quartier: data.quartier || null,
      repere: data.repère || null,
      customerLocation: fullLocation || null,
    };

    mutate(orderData as unknown as CreateOrderRequest, {
      onSuccess: (res: any) => {
        const orderNumber =
          res?.order?.order_number ??
          res?.order?.id ??
          res?.order_number ??
          res?.numero_commande ??
          res?.number ??
          res?.id;
        saveCustomerProfile(profileSnapshot);
        setLastCustomerPhone(profileSnapshot.phone);
        recordCompletedOrder(displayItems as any[]);
        if (token) {
          saveMemberProfile({
            userId: user?.id ?? null,
            name: profileSnapshot.name,
            email: profileSnapshot.email ?? null,
            phone: profileSnapshot.phone,
            commune: profileSnapshot.commune ?? null,
            quartier: profileSnapshot.quartier ?? null,
            repere: profileSnapshot.repere ?? null,
            customerLocation: profileSnapshot.customerLocation ?? null,
          });
        } else {
          saveSignupPrefill(profileSnapshot);
          // Set guest order flag to prompt account creation later
          setGuestOrderPlaced();
        }
        const conversionTargets = new Map<string, { campaignId?: number; productId?: number }>();
        displayItems.forEach((item: any) => {
          const campaignId = Number(item.sponsored_campaign_id || item.campaign_id || 0) || undefined;
          const isSponsored = Boolean(item.is_sponsored || campaignId);
          if (!isSponsored) return;
          const key = campaignId ? `c:${campaignId}` : `p:${item.id}`;
          if (!conversionTargets.has(key)) {
            conversionTargets.set(key, { campaignId, productId: item.id });
          }
        });
        conversionTargets.forEach((target) => recordConversion(target.campaignId, target.productId));
        toast({
          title: "Commande enregistrée",
          description: orderNumber
            ? `N° ${orderNumber} - Nous vous contacterons pour la livraison.`
            : "Nous vous contacterons bientôt pour la livraison.",
          duration: 6000,
        });
        if (!isDirect) clearCart();
        const qs = new URLSearchParams();
        qs.set("created", "1");
        if (orderNumber) qs.set("order", String(orderNumber));
        if (profileSnapshot.phone) qs.set("phone", profileSnapshot.phone);
        setLocation(`/orders?${qs.toString()}`);
      },
      onError: (err) => {
        toast({
          title: "Erreur",
          description: err instanceof Error ? err.message : "Impossible de créer la commande",
          variant: "destructive",
        });
      },
    });
  };

  if (!isDirect && items.length === 0) { setLocation("/cart"); return null; }
  if (isDirect && !directProductId) { setLocation("/"); return null; }
  if (isDirect && directProductId && directProductLoading)
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#f57224]" />
      </div>
    );
  if (isDirect && directProductId && !directProduct) { setLocation("/"); return null; }
  if (displayItems.length === 0) { setLocation("/cart"); return null; }

  const appendNote = (snippet: string) => {
    const current = form.getValues("notes") || "";
    const next = current.trim().length === 0 ? snippet : `${current.trim()} · ${snippet}`;
    form.setValue("notes", next, { shouldValidate: false });
  };

  const inputClass =
    "h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#f57224] focus:border-[#f57224] transition-colors";
  const selectClass =
    "h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#f57224] focus:border-[#f57224] transition-colors";
  const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-14 sm:pt-16 pb-16">

      {/* ── Fil d'Ariane ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 max-w-5xl py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#f57224] transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/cart" className="hover:text-[#f57224] transition-colors">Panier</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800 font-medium">Finaliser la commande</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 max-w-5xl pt-4 pb-6">

        {/* ── Titre — style Jumia ── */}
        <div className="bg-white border border-gray-200 rounded-md mb-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-1 h-6 rounded-full bg-[#f57224] shrink-0" />
            <div>
              <h1 className="text-base font-extrabold text-gray-900">Finaliser la commande</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Remplissez vos informations pour confirmer</p>
            </div>
          </div>
        </div>

        {/* ── Progression + options avancées ── */}
        <div className="bg-white border border-gray-200 rounded-md mb-4 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#f57224] text-white font-bold">1</span>
            Infos
            <span className="text-gray-300">›</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#fef3c7] text-amber-800 font-bold">2</span>
            Livraison
            <span className="text-gray-300">›</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold">3</span>
            Confirmation
            <span className="text-[11px] text-gray-400 ml-1">Commande express par défaut</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-semibold text-[#f57224] hover:text-[#e56614]"
          >
            {showAdvanced ? "Masquer les options avancées" : "Afficher les options avancées"}
          </button>
        </div>

        {isPending && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Traitement de votre commande en cours...
          </div>
        )}

        <div className="mb-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {token ? "Compte SISMA actif" : "Commande sans compte autorisée"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {token
                  ? "Vos informations seront sauvegardées pour le suivi, les notifications et le checkout express."
                  : "Finalisez votre achat sans créer de compte. Après cette première commande, SISMA vous proposera un compte pour le suivi, les notifications et le remplissage automatique."}
              </p>
            </div>
            {!token && (
              <Link
                href="/account?mode=register&source=checkout"
                className="inline-flex items-center justify-center rounded-xl border border-[#f57224]/20 bg-white px-4 py-2 text-sm font-semibold text-[#f57224] hover:bg-orange-50 transition-colors"
              >
                Je créerai mon compte après l'achat
              </Link>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">

          {/* ── Colonne formulaire (2/3) ── */}
          <div className="lg:col-span-2 space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* ── Bloc infos personnelles ── */}
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                    <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                    <User className="w-3.5 h-3.5 text-[#f57224]" />
                    <span className="text-sm font-bold text-gray-900">Informations personnelles</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <label className={labelClass}>Nom complet *</label>
                          <FormControl>
                            <input {...field} placeholder="Votre nom" className={inputClass} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <label className={labelClass}>Téléphone *</label>
                          <FormControl>
                            <input {...field} placeholder="07 00 00 00 00" className={inputClass} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <label className={labelClass}>Email (optionnel)</label>
                          <FormControl>
                            <input
                              type="email"
                              {...field}
                              placeholder="email@exemple.com"
                              className={inputClass}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {prefillNotice && (
                      <div className="sm:col-span-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        {prefillNotice} Vos informations sont prêtes pour une commande rapide.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Bloc adresse de livraison ── */}
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                    <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                    <MapPin className="w-3.5 h-3.5 text-[#f57224]" />
                    <span className="text-sm font-bold text-gray-900">Adresse de livraison</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Commune */}
                    <FormField
                      control={form.control}
                      name="commune"
                      render={({ field }) => (
                        <FormItem>
                          <label className={labelClass}>Commune *</label>
                          <FormControl>
                            <select
                              {...field}
                              value={field.value || ""}
                              className={selectClass}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                form.setValue("quartier", "", { shouldValidate: false });
                              }}
                            >
                              <option value="">Sélectionner une commune</option>
                              {communes.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Quartier */}
                    {selectedCommune && (
                      <FormField
                        control={form.control}
                        name="quartier"
                        render={({ field }) => (
                          <FormItem>
                            <label className={labelClass}>Quartier</label>
                            <FormControl>
                              <select
                                {...field}
                                value={field.value || ""}
                                className={selectClass}
                                disabled={!hasQuartiers}
                              >
                                <option value="">
                                  {hasQuartiers ? "Sélectionner un quartier" : "Aucun quartier disponible"}
                                </option>
                                {quartiers.map((q) => (
                                  <option key={q} value={q}>{q}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Repère */}
                    {selectedCommune && (
                      <FormField
                        control={form.control}
                        name="repère"
                        render={({ field }) => (
                          <FormItem>
                            <label className={labelClass}>Repère (optionnel)</label>
                            <FormControl>
                              <input
                                {...field}
                                value={field.value || ""}
                                placeholder="Ex: Près de la pharmacie, Rue principale..."
                                className={inputClass}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Adresse libre (hors Abidjan) */}
                    <FormField
                      control={form.control}
                      name="customerLocation"
                      render={({ field }) => (
                        <FormItem>
                          <label className={labelClass}>
                            {selectedCommune ? "Détails supplémentaires" : "Lieu de livraison (si hors Abidjan)"}
                          </label>
                          <FormControl>
                            <input
                              {...field}
                              value={field.value || ""}
                              placeholder={
                                selectedCommune
                                  ? "Détails supplémentaires..."
                                  : "Ville, Commune, Quartier, Repère..."
                              }
                              className={inputClass}
                              disabled={!!selectedCommune}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {!showAdvanced && (
                  <div className="bg-white border border-gray-200 rounded-md p-4 text-xs text-gray-600">
                    Livraison immédiate par défaut. Vous pouvez programmer une date ou ajouter des consignes dans
                    les options avancées.
                  </div>
                )}

                {showAdvanced && (
                  <>
                    {/* ── Bloc type de livraison ── */}
                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                        <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                        <Truck className="w-3.5 h-3.5 text-[#f57224]" />
                        <span className="text-sm font-bold text-gray-900">Type de livraison</span>
                      </div>
                      <div className="p-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="deliveryType"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-2"
                                >
                                  <label
                                    htmlFor="immediate"
                                    className={`flex items-center gap-3 p-3 rounded border-2 cursor-pointer transition-all ${
                                      field.value === "immediate"
                                        ? "border-[#f57224] bg-[#f57224]/5"
                                        : "border-gray-200 hover:border-[#f57224]/40"
                                    }`}
                                  >
                                    <RadioGroupItem value="immediate" id="immediate" />
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">Immédiate</p>
                                      <p className="text-xs text-gray-500">Le plus tôt possible</p>
                                    </div>
                                  </label>
                                  <label
                                    htmlFor="programmed"
                                    className={`flex items-center gap-3 p-3 rounded border-2 cursor-pointer transition-all ${
                                      field.value === "programmed"
                                        ? "border-[#f57224] bg-[#f57224]/5"
                                        : "border-gray-200 hover:border-[#f57224]/40"
                                    }`}
                                  >
                                    <RadioGroupItem value="programmed" id="programmed" />
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">Programmée</p>
                                      <p className="text-xs text-gray-500">Choisir une date</p>
                                    </div>
                                  </label>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        {form.watch("deliveryType") === "programmed" && (
                          <FormField
                            control={form.control}
                            name="deliveryDate"
                            render={({ field }) => (
                              <FormItem>
                                <label className={labelClass}>Date souhaitée</label>
                                <FormControl>
                                  <input
                                    type="date"
                                    {...field}
                                    value={field.value || ""}
                                    className={inputClass}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    {/* ── Bloc consignes ── */}
                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                        <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                        <ClipboardList className="w-3.5 h-3.5 text-[#f57224]" />
                        <span className="text-sm font-bold text-gray-900">Consignes de livraison</span>
                        <span className="text-[10px] text-gray-400 ml-1">(optionnel)</span>
                      </div>
                      <div className="p-4">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex : À livrer aujourd'hui, appeler avant d'arriver, laisser au gardien..."
                                  {...field}
                                  value={field.value || ""}
                                  className="rounded border border-gray-300 min-h-[90px] text-sm focus:ring-1 focus:ring-[#f57224] focus:border-[#f57224] resize-none"
                                />
                              </FormControl>
                              <div className="flex flex-wrap gap-1.5 pt-2.5">
                                {[
                                  { label: "À livrer aujourd'hui", color: "amber" },
                                  { label: "Matin (8h–12h)", color: "blue" },
                                  { label: "Après-midi (12h–17h)", color: "indigo" },
                                  { label: "Soir (17h–20h)", color: "purple" },
                                ].map(({ label, color }) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => appendNote(label)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors
                                      ${color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : ""}
                                      ${color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : ""}
                                      ${color === "indigo" ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" : ""}
                                      ${color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" : ""}
                                    `}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Bouton submit mobile (visible sur petits écrans) ── */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="lg:hidden w-full h-12 rounded bg-[#f57224] hover:bg-[#e56614] text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#f57224]/20"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Confirmer la commande</>
                  )}
                </button>

              </form>
            </Form>
          </div>

          {/* ── Colonne résumé commande (1/3, sticky) ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">

              {/* Résumé articles */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                  <Package className="w-3.5 h-3.5 text-[#f57224]" />
                  <span className="text-sm font-bold text-gray-900">
                    Résumé ({displayItems.length} article{displayItems.length > 1 ? "s" : ""})
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {displayItems.map((item: any, i: number) => {
                    const itemPrice =
                      (item as any).discountedPrice ?? item.price;
                    return (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-14 h-14 rounded border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-tight">
                            {item.name}
                          </p>
                          {(item.color || item.size) && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {[item.color, item.size].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">Qté : {item.quantity}</p>
                        </div>
                        <p className="text-xs font-bold text-gray-900 shrink-0">
                          {(itemPrice * item.quantity).toLocaleString("fr-FR")} F
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <span className="w-1 h-5 rounded-full bg-[#f57224] shrink-0" />
                  <span className="text-sm font-bold text-gray-900">Récapitulatif</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Sous-total</span>
                    <span className="font-medium">{totalDisplay.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      Livraison
                      {isCalculatingFee && <Loader2 className="h-3 w-3 animate-spin text-[#f57224]" />}
                    </span>
                    <span className="font-medium">
                      {deliveryFee.toLocaleString("fr-FR")} FCFA
                      {selectedCommune && (
                        <span className="text-[10px] text-gray-400 ml-1">({selectedCommune})</span>
                      )}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-gray-900">Total à payer</span>
                    <span className="text-xl font-extrabold text-[#f57224]">
                      {(totalDisplay + deliveryFee).toLocaleString("fr-FR")}
                      <span className="text-sm font-bold ml-1">FCFA</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA desktop */}
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isPending}
                className="hidden lg:flex w-full h-12 rounded bg-[#f57224] hover:bg-[#e56614] text-white font-bold text-base items-center justify-center gap-2 transition-colors shadow-md shadow-[#f57224]/20"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Check className="w-4 h-4" /> Confirmer la commande</>
                )}
              </button>

              {/* Trust mini */}
              <div className="bg-white border border-gray-200 rounded-md p-3 space-y-2">
                {[
                  { icon: ShieldCheck, text: "Paiement à la livraison" },
                  { icon: Truck, text: "Livraison 24–72h en CI" },
                  { icon: RotateCcw, text: "Retour sous 14 jours" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon className="w-3.5 h-3.5 text-[#f57224] shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
