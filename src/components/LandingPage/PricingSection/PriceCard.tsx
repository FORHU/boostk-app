export interface PricingPlan {
    title: string;
    price: string;
    subtitle: string;
    bestFor: string;
    icons: string[];
    features: string[];
    cta: string;
    highlight?: boolean;
    badge?: string;
}

export const PriceCard = ({
  title,
  price,
  subtitle,
  bestFor,
  icons,
  features,
  cta,
  highlight = false,
  badge
}: PricingPlan) => (
  <div className="group h-full">
    <div className={`h-full bg-white border p-6 md:p-8 flex flex-col relative rounded-lg transition-all duration-300 ease-out ${highlight ? 'border-2 border-blue-400 md:scale-105 z-10 shadow-xl hover:shadow-2xl hover:scale-110 hover:border-blue-500' : 'border-slate-200 shadow-sm hover:shadow-xl hover:scale-105 hover:border-blue-300'}`}>
      {badge && (
        <div className={`absolute ${highlight ? '-top-4 left-1/2 -translate-x-1/2' : 'top-4 right-4'}`}>
          <span className={`${highlight ? 'bg-primary text-white shadow-lg px-4 py-1.5 rounded-full' : 'bg-blue-50 text-primary px-2 py-1 rounded border border-blue-100'} text-[10px] font-bold uppercase`}>
            {badge}
          </span>
        </div>
      )}
      <div className="mb-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center mb-4 rounded transition-colors duration-300 group-hover:bg-blue-100">
          <span className="material-symbols-outlined">{icons[0]}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-6">{subtitle}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900">${price}</span>
          <span className="text-slate-400 text-sm">/mo</span>
        </div>
      </div>
      <div className={`${highlight ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'} p-4 mb-6 border rounded-lg transition-colors duration-300`}>
        <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-blue-600' : 'text-slate-400'}`}>Best for:</p>
        <p className="text-sm font-semibold text-slate-700 leading-tight">{bestFor}</p>
      </div>
      <div className="mb-6">
        <p className="text-xs font-bold text-slate-900 mb-2">What You&apos;ll Get:</p>
        <div className="grid grid-cols-2 gap-2">
          {icons.map((icon, i) => (
            <div key={i} className="bg-slate-100 rounded h-12 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400 text-sm">{icon}</span>
            </div>
          ))}
        </div>
      </div>
      <ul className="space-y-3 mb-10 flex-grow">
        {features.slice(0, 3).map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
            <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5">check_circle_outline</span>
            <span>{f}</span>
          </li>
        ))}
        <div className="pt-4 mt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-900 mb-3">Also Includes:</p>
          <div className="space-y-2">
            {features.slice(3).map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-xs font-medium text-slate-500">
                <span className="material-symbols-outlined text-blue-600 text-sm flex-shrink-0">check</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </ul>
      <button className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-300 rounded ${highlight ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 text-white hover:shadow-2xl hover:scale-105 shadow-lg shadow-blue-500/30' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:scale-105'}`}>
        {cta}
      </button>
      <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">Cancel anytime • No setup fees</p>
    </div>
  </div>
);