// === Configuración ===
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// === Utilidades de fechas (ES) ===
const mesesES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const diasES = ["DOMINGO","LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO"];

function yyyy_mm(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}
function toISO(date){ return date.toISOString().slice(0,10); }

// === Estado UI ===
const selMes = document.getElementById('mes');
const selDia = document.getElementById('dia');
const selBloque = document.getElementById('bloque');
const listaM = document.getElementById('listaM');
const listaT = document.getElementById('listaT');
const titulo = document.getElementById('sheetTitle');
const form = document.getElementById('formInscribir');
const nombreInput = document.getElementById('nombre');
const estado = document.getElementById('estado');

// === Cargar combos de mes/día ===
function llenarMeses(){
  selMes.innerHTML = "";
  const base = new Date(); base.setDate(1);
  const visibles = window.MESES_HABILITADOS?.length ? window.MESES_HABILITADOS : [
    yyyy_mm(base), // mes actual
    yyyy_mm(new Date(base.getFullYear(), base.getMonth()+1, 1)) // mes siguiente
  ];
  visibles.forEach(key=>{
    const [y,m] = key.split("-").map(x=>parseInt(x,10));
    const d = new Date(y, m-1, 1);
    const op = document.createElement('option');
    op.value = key;
    op.textContent = mesesES[d.getMonth()] + " " + d.getFullYear();
    selMes.appendChild(op);
  });
}
function diasDelMes(yyyyMM){
  const [y,m] = yyyyMM.split("-").map(x=>parseInt(x,10));
  const first = new Date(y, m-1, 1);
  const days = new Date(y, m, 0).getDate();
  const arr = [];
  for(let d=1; d<=days; d++){
    const date = new Date(y, m-1, d);
    arr.push({iso: toISO(date), label: `${diasES[date.getDay()]} ${d}`});
  }
  return arr;
}
function llenarDias(){
  selDia.innerHTML = "";
  const yyyyMM = selMes.value;
  diasDelMes(yyyyMM).forEach(d=>{
    const op = document.createElement('option');
    op.value = d.iso;
    op.textContent = d.label;
    selDia.appendChild(op);
  });
}

// === Render cupos (consulta a Supabase) ===
async function cargarCupos(){
  const day = selDia.value;
  titulo.textContent = `${selDia.options[selDia.selectedIndex].text} — ${mesesES[new Date(day).getMonth()]}`;
  await Promise.all([renderBloque(day, 'M'), renderBloque(day, 'T')]);
}

async function renderBloque(dayISO, bloque){
  const ul = bloque === 'M' ? listaM : listaT;
  ul.innerHTML = "";
  // Traer inscripciones existentes (ordenadas por slot_no)
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('dia', dayISO)
    .eq('bloque', bloque)
    .order('slot_no', {ascending:true});
  if (error) { console.error(error); return; }

  const ocupadas = new Map((data||[]).map(r => [r.slot_no, r.nombre]));
  for(let i=1;i<=6;i++){
    const li = document.createElement('li');
    const nombre = ocupadas.get(i);
    if (nombre){
      li.innerHTML = `<span>${i}. ${escapeHtml(nombre)}</span><span class="badge">Inscrito</span>`;
    } else {
      li.innerHTML = `<span class="slot-empty">${i}. (libre)</span><span class="badge">Cupo</span>`;
    }
    ul.appendChild(li);
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }

// === Lógica de inscripción ===
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  estado.textContent = "";
  const name = nombreInput.value.trim();
  if (!name) return;

  const dia = selDia.value;
  const bloque = selBloque.value;

  // Traer slots existentes para calcular el primer libre
  const { data: rows, error } = await supabase
    .from('reservas')
    .select('slot_no')
    .eq('dia', dia)
    .eq('bloque', bloque)
    .order('slot_no', {ascending:true});
  if (error) { estado.textContent = "Error consultando cupos."; return; }

  // Buscar primer slot disponible 1..6
  const taken = new Set((rows||[]).map(r=>r.slot_no));
  let slot = null;
  for(let i=1;i<=6;i++){ if(!taken.has(i)){ slot = i; break; } }
  if (!slot){
    estado.textContent = "Este bloque ya está lleno.";
    await cargarCupos();
    return;
  }

  // Intentar reservar ese slot (servidor valida límite)
  const { error: insErr } = await supabase
    .from('reservas')
    .insert({ dia, bloque, slot_no: slot, nombre: name });
  if (insErr){
    // En caso de carrera (otro tomó el slot), reintentar refrescando
    await cargarCupos();
    estado.textContent = "El bloque se llenó mientras registrabas. Intenta con otro bloque o día.";
    return;
  }

  nombreInput.value = "";
  await cargarCupos();
  estado.textContent = "¡Inscripción registrada!";
});

// === Eventos UI ===
selMes.addEventListener('change', ()=>{ llenarDias(); cargarCupos(); });
selDia.addEventListener('change', ()=>{ cargarCupos(); });
selBloque.addEventListener('change', ()=>{ /* nada que recargar aquí */ });

// === Inicio ===
llenarMeses();
llenarDias();
cargarCupos();
