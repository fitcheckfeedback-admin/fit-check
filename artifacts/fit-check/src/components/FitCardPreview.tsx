import { FitCardData } from "@/lib/fitCardCaption";
import { formatTemp } from "@/lib/format";

export function FitCardPreview({ data }: { data: FitCardData }) {
  const hasPhoto = !!data.userPhoto;

  return (
    <div className="w-full max-w-[340px] aspect-square mx-auto rounded-3xl bg-gradient-to-br from-[#FFF3E0] to-[#FFB347] shadow-xl overflow-hidden relative text-left">
      <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_50%)] pointer-events-none" />

      {hasPhoto ? (
        /* Split layout — photo left, info right */
        <div className="flex h-full relative z-10">
          {/* Photo panel */}
          <div className="w-[44%] h-full relative overflow-hidden">
            <img
              src={data.userPhoto}
              alt="Your fit"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FFF3E0]/60" />
          </div>

          {/* Info panel */}
          <div className="flex-1 flex flex-col p-3 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-lg shadow-sm bg-white shrink-0" />
                <span className="text-sm font-bold text-slate-900 leading-tight">FIT✔️</span>
              </div>
              <div className="bg-white/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                <span className="text-[8px] font-bold text-slate-500">SCORE</span>
                <span className={`text-xs font-bold ${data.fitScore >= 80 ? 'text-amber-500' : data.fitScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>{data.fitScore}</span>
              </div>
            </div>

            {/* Location */}
            <div className="mt-1.5 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[9px] font-medium text-amber-900 truncate">{data.location}</span>
            </div>

            <div className="h-px w-full bg-amber-900/10 my-2" />

            {/* Weather */}
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
                {formatTemp(data.temperatureF, data.units)}
              </div>
              <div className="text-[9px] font-medium text-slate-600 mt-0.5">{data.weatherLabel}</div>
            </div>

            <div className="h-px w-full bg-amber-900/10 my-2" />

            {/* Outfit */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-[8px] font-bold text-amber-600 tracking-wider mb-0.5">TODAY'S FIT</div>
              <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-3">{data.mainOutfit}</div>
              {data.outerwear && (
                <div className="mt-1 text-[9px] font-bold text-slate-800 leading-snug line-clamp-1">
                  <span className="text-amber-600 mr-1">+</span>{data.outerwear}
                </div>
              )}
            </div>

            {/* Hashtags */}
            <div className="mt-1 text-[7px] font-medium text-amber-900/60 leading-tight line-clamp-2">
              {data.hashtags.slice(0, 5).join(" ")}
            </div>
          </div>
        </div>
      ) : (
        /* No-photo layout — original centered */
        <div className="p-5 flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl shadow-md bg-white" />
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-amber-800/70 leading-none">FIT CARD</span>
                <span className="text-xl font-bold text-slate-900 leading-tight">FIT✔️</span>
              </div>
            </div>
            <div className="bg-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500">SCORE</span>
              <span className={`text-sm font-bold ${data.fitScore >= 80 ? 'text-amber-500' : data.fitScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>{data.fitScore}</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-900">{data.location}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 ml-3">{data.date}</div>
          </div>

          <div className="h-px w-full bg-amber-900/10 my-3" />

          <div className="text-center my-1">
            <div className="text-5xl font-bold text-slate-900 tracking-tighter">
              {formatTemp(data.temperatureF, data.units)}
            </div>
            <div className="text-xs font-medium text-slate-600">{data.weatherLabel}</div>
          </div>

          <div className="h-px w-full bg-amber-900/10 my-3" />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-[10px] font-bold text-amber-600 tracking-wider mb-1">TODAY'S FIT</div>
            <div className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{data.mainOutfit}</div>
            {data.outerwear && (
              <div className="mt-2 text-xs font-bold text-slate-800 leading-snug line-clamp-1">
                <span className="text-amber-600 text-[10px] mr-1">LAYER</span>
                {data.outerwear}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {data.accessories.slice(0, 3).map((acc, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/50 rounded-lg text-[9px] font-bold text-amber-900 truncate max-w-full">
                  {acc}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 text-[9px] font-medium text-amber-900/60 leading-tight line-clamp-2">
            {data.hashtags.slice(0, 6).join(" ")}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-r from-amber-500/90 to-amber-600/90 flex items-center justify-center z-20">
        <span className="text-[9px] font-bold text-white/90">fitcheck.app</span>
      </div>
    </div>
  );
}
