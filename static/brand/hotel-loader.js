/* Global loader for:
   - initial page transitions in the portal
   - uploads / API calls initiated from JS
   The loader shows progress animation (indeterminate) and clearly indicates
   "stuck" vs "error".
*/

(function(){
  const root = document.getElementById("hotel-loader");
  if(!root) return;

  const titleEl = document.getElementById("hotel-loader-title");
  const hintEl = document.getElementById("hotel-loader-hint");
  const retryBtn = document.getElementById("hotel-loader-retry");

  let stuckTimer = null;
  let activeCount = 0;

  function setState(state){
    root.classList.remove("hotel-loader--stuck","hotel-loader--error");
    if(state === "stuck") root.classList.add("hotel-loader--stuck");
    if(state === "error") root.classList.add("hotel-loader--error");
  }

  function show(opts){
    activeCount++;
    root.hidden = false;
    root.setAttribute("aria-busy","true");
    setState("loading");
    if(titleEl) titleEl.textContent = (opts && opts.title) ? opts.title : "Načítám…";
    if(hintEl) hintEl.textContent = (opts && opts.hint) ? opts.hint : "Prosím vyčkejte.";
    if(retryBtn){
      retryBtn.hidden = true;
      retryBtn.onclick = null;
    }
    clearTimeout(stuckTimer);
    stuckTimer = setTimeout(()=>{
      if(activeCount > 0){
        setState("stuck");
        if(hintEl) hintEl.textContent = "Trvá to déle než obvykle. Pokud se to nezmění, obnovte stránku.";
      }
    }, 12000);
  }

  function hide(){
    activeCount = Math.max(0, activeCount - 1);
    if(activeCount > 0) return;
    clearTimeout(stuckTimer);
    setState("loading");
    root.hidden = true;
    root.setAttribute("aria-busy","false");
  }

  function error(opts){
    clearTimeout(stuckTimer);
    setState("error");
    root.hidden = false;
    root.setAttribute("aria-busy","false");
    if(titleEl) titleEl.textContent = (opts && opts.title) ? opts.title : "Došlo k chybě";
    if(hintEl) hintEl.textContent = (opts && opts.hint) ? opts.hint : "Zkontrolujte připojení a zkuste to znovu.";
    if(retryBtn){
      retryBtn.hidden = false;
      retryBtn.onclick = (opts && typeof opts.onRetry === "function") ? opts.onRetry : ()=>location.reload();
    }
  }

  function wrapPromise(promise, opts){
    show(opts);
    return Promise.resolve(promise).then((res)=>{
      hide();
      return res;
    }).catch((err)=>{
      error({
        title: (opts && opts.errorTitle) ? opts.errorTitle : "Došlo k chybě",
        hint: (opts && opts.errorHint) ? opts.errorHint : "Akce se nepodařila. Zkuste to znovu.",
        onRetry: (opts && opts.onRetry) ? opts.onRetry : null,
      });
      throw err;
    });
  }

  document.addEventListener("click", (e)=>{
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if(!a) return;
    const href = a.getAttribute("href") || "";
    if(!href || href.startsWith("#")) return;
    if(a.target === "_blank") return;
    if(a.hasAttribute("data-no-loader")) return;
    if(href.startsWith("http") && !href.startsWith(location.origin)) return;
    show({title:"Otevírám…", hint:"Načítám další stránku."});
  }, {capture:true});

  const origFetch = window.fetch;
  if(typeof origFetch === "function"){
    window.fetch = function(input, init){
      const method = (init && init.method) ? String(init.method).toUpperCase() : "GET";
      const url = (typeof input === "string") ? input : (input && input.url) ? input.url : "";
      const should = !/\/static\//.test(url) && (method !== "GET" || /\/api\//.test(url));
      if(!should) return origFetch(input, init);
      return wrapPromise(origFetch(input, init), {title:"Pracuji…", hint:"Komunikuji se serverem."});
    };
  }

  window.HotelLoader = { show, hide, error, wrapPromise };
})();
