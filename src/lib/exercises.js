import { addDoc, average, collection, count, deleteDoc, doc, documentId, getAggregateFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const defaultExercises = [
  ['Flexão de braço', 'chest', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '8–12', 60, 'Mantenha o corpo alinhado e desça com controle.'],
  ['Flexão inclinada', 'chest', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '10–15', 45, 'Use uma superfície firme e estável para apoiar as mãos.'],
  ['Supino com halteres', 'chest', ['dumbbells'], ['home', 'gym'], 2, '8–12', 75, 'Escolha pesos confortáveis e mantenha os punhos alinhados.'],
  ['Supino na máquina', 'chest', ['machines'], ['gym'], 1, '10–12', 60, 'Ajuste o assento para manter as mãos na altura do peito.'],
  ['Remada com mochila', 'back', ['bodyweight'], ['home', 'outdoors'], 1, '10–12', 60, 'Use uma mochila bem fechada e incline o tronco com as costas retas.'],
  ['Remada com halteres', 'back', ['dumbbells'], ['home', 'gym'], 2, '8–12', 75, 'Puxe os cotovelos para trás sem girar o tronco.'],
  ['Puxada na barra', 'back', ['barbell'], ['gym', 'outdoors'], 3, '6–10', 90, 'Use uma barra bem instalada e adapte a amplitude ao seu nível.'],
  ['Puxada na máquina', 'back', ['machines'], ['gym'], 1, '10–12', 60, 'Puxe a barra até a altura do peito sem balançar.'],
  ['Agachamento livre', 'legs', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '10–15', 60, 'Desça até onde for confortável, mantendo os pés apoiados.'],
  ['Afundo alternado', 'legs', ['bodyweight'], ['home', 'gym', 'outdoors'], 2, '8 cada lado', 60, 'Dê um passo firme e mantenha o equilíbrio.'],
  ['Agachamento com halteres', 'legs', ['dumbbells'], ['home', 'gym'], 2, '10–12', 75, 'Segure pesos leves ao lado do corpo e mantenha o tronco estável.'],
  ['Extensão de pernas', 'legs', ['machines'], ['gym'], 1, '10–12', 60, 'Ajuste o equipamento e estenda as pernas sem travar os joelhos.'],
  ['Elevação lateral', 'shoulders', ['dumbbells'], ['home', 'gym'], 2, '10–12', 60, 'Eleve os braços até uma altura confortável sem encolher os ombros.'],
  ['Flexão pike', 'shoulders', ['bodyweight'], ['home', 'gym', 'outdoors'], 2, '6–10', 60, 'Mantenha o quadril elevado e faça o movimento com controle.'],
  ['Desenvolvimento na máquina', 'shoulders', ['machines'], ['gym'], 1, '10–12', 60, 'Ajuste o assento e use uma carga leve para começar.'],
  ['Rosca com halteres', 'arms', ['dumbbells'], ['home', 'gym'], 1, '10–12', 60, 'Mantenha os cotovelos próximos ao tronco.'],
  ['Tríceps no banco', 'arms', ['bodyweight'], ['home', 'gym', 'outdoors'], 2, '8–12', 60, 'Apoie-se em uma superfície estável e mantenha uma amplitude confortável.'],
  ['Rosca na máquina', 'arms', ['machines'], ['gym'], 1, '10–12', 60, 'Ajuste o apoio e movimente os braços sem impulso.'],
  ['Prancha', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '20–40s', 45, 'Mantenha o corpo alinhado e reduza o tempo se precisar.'],
  ['Dead bug', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '8 cada lado', 45, 'Movimente braços e pernas devagar, mantendo a lombar confortável.'],
  ['Abdominal na máquina', 'core', ['machines'], ['gym'], 1, '10–12', 60, 'Use carga leve e evite puxar o pescoço.'],
  ['Prancha com toque no ombro', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 2, '8 cada lado', 45, 'Alterne as mãos com controle e mantenha o quadril estável.'],
  ['Supino inclinado com halteres', 'chest', ['dumbbells'], ['home', 'gym'], 2, '8–12', 75, 'Mantenha as escápulas apoiadas e controle a descida.'],
  ['Crucifixo com halteres', 'chest', ['dumbbells'], ['home', 'gym'], 2, '10–12', 60, 'Use carga leve e mantenha os cotovelos suavemente flexionados.'],
  ['Flexão com joelhos apoiados', 'chest', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '8–12', 45, 'Mantenha o tronco alinhado dos joelhos aos ombros.'],
  ['Remada unilateral com halter', 'back', ['dumbbells'], ['home', 'gym'], 2, '8 cada lado', 60, 'Apoie uma mão e mantenha as costas estáveis.'],
  ['Remada baixa na máquina', 'back', ['machines'], ['gym'], 2, '10–12', 60, 'Puxe em direção ao abdômen sem arredondar as costas.'],
  ['Levantamento terra romeno com halteres', 'back', ['dumbbells'], ['home', 'gym'], 2, '8–10', 90, 'Leve o quadril para trás e mantenha os pesos perto das pernas.'],
  ['Superman', 'back', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '10–12', 45, 'Eleve pouco os braços e as pernas, sem forçar a lombar.'],
  ['Ponte de glúteos', 'legs', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '12–15', 45, 'Contraia os glúteos no alto e evite arquear a lombar.'],
  ['Elevação pélvica com carga', 'legs', ['dumbbells'], ['home', 'gym'], 2, '10–12', 75, 'Apoie as costas com segurança e aumente a carga gradualmente.'],
  ['Agachamento búlgaro', 'legs', ['bodyweight', 'dumbbells'], ['home', 'gym'], 3, '8 cada lado', 75, 'Use um apoio estável e mantenha o joelho alinhado ao pé.'],
  ['Levantamento de panturrilha', 'legs', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '12–20', 45, 'Suba e desça devagar, usando apoio para equilibrar-se.'],
  ['Mesa flexora', 'legs', ['machines'], ['gym'], 2, '10–12', 60, 'Ajuste o equipamento para que o joelho fique alinhado ao eixo.'],
  ['Desenvolvimento com halteres', 'shoulders', ['dumbbells'], ['home', 'gym'], 2, '8–12', 75, 'Mantenha o abdômen firme e use uma amplitude confortável.'],
  ['Face pull', 'shoulders', ['bands', 'machines'], ['home', 'gym'], 2, '12–15', 60, 'Puxe em direção ao rosto com os cotovelos abertos.'],
  ['Elevação frontal', 'shoulders', ['dumbbells'], ['home', 'gym'], 2, '10–12', 60, 'Eleve até a altura dos ombros sem balançar o corpo.'],
  ['Rosca martelo', 'arms', ['dumbbells'], ['home', 'gym'], 2, '10–12', 60, 'Mantenha as palmas voltadas uma para a outra.'],
  ['Tríceps acima da cabeça', 'arms', ['dumbbells'], ['home', 'gym'], 2, '10–12', 60, 'Mantenha os cotovelos apontados para a frente.'],
  ['Rosca com elástico', 'arms', ['bands'], ['home', 'gym', 'outdoors'], 1, '12–15', 45, 'Prenda o elástico em local seguro e controle a volta.'],
  ['Tríceps com elástico', 'arms', ['bands'], ['home', 'gym', 'outdoors'], 1, '12–15', 45, 'Mantenha os cotovelos junto ao corpo.'],
  ['Abdominal bicicleta', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '10 cada lado', 45, 'Faça o movimento devagar, sem puxar a nuca.'],
  ['Prancha lateral', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 2, '20–30s cada lado', 45, 'Apoie o antebraço e mantenha o quadril elevado.'],
  ['Bird dog', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '8 cada lado', 45, 'Estenda braço e perna opostos sem girar o quadril.'],
  ['Abdominal reverso', 'core', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '10–15', 45, 'Eleve o quadril pouco e mantenha o movimento controlado.'],
  ['Polichinelo', 'full_body', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '30–45s', 45, 'Escolha a versão sem saltos se preferir baixo impacto.'],
  ['Mountain climber', 'full_body', ['bodyweight'], ['home', 'gym', 'outdoors'], 2, '20–30s', 45, 'Mantenha os ombros sobre as mãos e ajuste o ritmo.'],
  ['Agachamento e alcance', 'full_body', ['bodyweight'], ['home', 'gym', 'outdoors'], 1, '10–12', 45, 'Agache em amplitude confortável e alcance os braços ao subir.'],
  ['Caminhada do fazendeiro', 'full_body', ['dumbbells'], ['home', 'gym', 'outdoors'], 2, '30–45s', 60, 'Caminhe com postura alta e pesos leves ao lado do corpo.'],
  ['Step-up em degrau baixo', 'legs', ['bodyweight', 'dumbbells'], ['home', 'gym', 'outdoors'], 1, '8 cada lado', 60, 'Use um degrau firme e baixo, subindo sem impulso.'],
].map(([name, muscle, equipment, places, level, reps, rest_seconds, instructions], index) => ({ id: `exercise-${index + 1}`, name, muscle, equipment, places, level, reps, rest_seconds, instructions }));

const muscleMap = { Peito: ['chest'], Costas: ['back'], Pernas: ['legs'], Ombros: ['shoulders'], Braços: ['arms'], Abdômen: ['core'], 'Corpo todo': ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'] };
const placeMap = { 'Em casa': 'home', Academia: 'gym', 'Ao ar livre': 'outdoors' };
const levelMap = { Iniciante: 1, Intermediário: 2, Avançado: 3 };

export async function generateAndSaveWorkout({ uid, muscle, place, equipment, duration, level }) {
  const selectedMuscles = muscleMap[muscle];
  const placeKey = placeMap[place];
  if (!uid || !selectedMuscles || !placeKey || !equipment?.length || !levelMap[level]) throw new Error('Confira as opções do treino e tente novamente.');

  const remote = await listExercises();
  const available = [...defaultExercises, ...remote.filter((item) => !defaultExercises.some((base) => base.name.toLocaleLowerCase() === item.name?.toLocaleLowerCase()))];
  const matches = available.filter((exercise) => selectedMuscles.includes(exercise.muscle) && exercise.level <= levelMap[level] && exercise.places.includes(placeKey) && exercise.equipment.some((item) => equipment.includes(({ bodyweight: 'Peso corporal', dumbbells: 'Halteres', bands: 'Elástico', barbell: 'Barra', machines: 'Máquinas' })[item])));
  if (!matches.length) throw new Error('Ainda não temos exercícios para essa combinação. Tente outro equipamento ou local.');

  const count = Math.min(matches.length, Math.max(4, Math.floor(Number(duration) / 6)));
  const exercises = matches.slice(0, count).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    sets: Math.min(5, 3 + Math.max(0, levelMap[level] - 1)),
    reps: exercise.reps,
    rest_seconds: exercise.rest_seconds,
    instructions: exercise.instructions,
  }));
  const workout = {
    title: muscle === 'Corpo todo' ? 'Corpo todo, no seu ritmo' : `${muscle}, no seu ritmo`,
    muscle,
    place,
    equipment,
    duration: Number(duration),
    level,
    exercises,
  };

  let saved;
  try {
    saved = await addDoc(collection(db, 'users', uid, 'workouts'), { ...workout, completedExerciseIds: [], completedSetIds: [], completedAt: null, createdAt: serverTimestamp() });
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('O Firebase recusou salvar este treino. Verifique se as regras de segurança de firestore.rules foram publicadas no projeto configurado.');
    }
    throw new Error('Não foi possível salvar seu treino. Confira a conexão e tente novamente.');
  }
  return { ...workout, id: saved.id };
}

export async function getSavedWorkout(uid, workoutId) {
  const snapshot = await getDoc(doc(db, 'users', uid, 'workouts', workoutId));
  if (!snapshot.exists()) throw new Error('Este treino não foi encontrado. Gere um novo treino para começar.');
  return { id: snapshot.id, ...snapshot.data() };
}

const HISTORY_PAGE_SIZE = 30;

export async function listCompletedWorkouts(uid, cursor = null) {
  const workoutsRef = collection(db, 'users', uid, 'workouts');
  const completedQuery = query(workoutsRef, where('completedAt', '!=', null));
  const orderedQuery = query(completedQuery, orderBy('completedAt', 'desc'));
  const pageQuery = query(orderedQuery, ...(cursor ? [startAfter(cursor)] : []), limit(HISTORY_PAGE_SIZE));
  const [snapshot, aggregate] = await Promise.all([
    getDocs(pageQuery),
    getAggregateFromServer(completedQuery, { total: count(), averageDuration: average('duration') }),
  ]);
  const lastDocument = snapshot.docs[snapshot.docs.length - 1] || cursor;
  const metrics = aggregate.data();
  return {
    workouts: snapshot.docs.map((workoutDoc) => ({ id: workoutDoc.id, ...workoutDoc.data() })),
    cursor: lastDocument,
    hasMore: snapshot.size === HISTORY_PAGE_SIZE,
    totalCount: metrics.total,
    averageDuration: metrics.averageDuration == null ? 0 : Math.round(metrics.averageDuration),
  };
}

export function getExerciseSetCount(exercise) {
  return Math.max(1, Number(exercise?.sets) || 1);
}

export function getWorkoutSetIds(exercises = []) {
  return exercises.flatMap((exercise) => Array.from(
    { length: getExerciseSetCount(exercise) },
    (_, index) => `${exercise.id}-set-${index + 1}`,
  ));
}

export function getCompletedSetIds(workout) {
  if (Array.isArray(workout.completedSetIds)) return workout.completedSetIds;
  // Treinos anteriores marcavam exercícios inteiros; trate-os como séries concluídas.
  return (workout.completedExerciseIds || []).flatMap((exerciseId) => {
    const exercise = workout.exercises?.find((item) => item.id === exerciseId);
    return exercise ? getWorkoutSetIds([exercise]) : [];
  });
}

export async function saveWorkoutProgress(uid, workoutId, completedSetIds, exercises) {
  const completedExerciseIds = exercises
    .filter((exercise) => Array.from(
      { length: getExerciseSetCount(exercise) },
      (_, index) => `${exercise.id}-set-${index + 1}`,
    ).every((setId) => completedSetIds.includes(setId)))
    .map((exercise) => exercise.id);
  const totalSets = getWorkoutSetIds(exercises).length;
  const completedAt = totalSets > 0 && completedSetIds.length === totalSets ? serverTimestamp() : null;
  await updateDoc(doc(db, 'users', uid, 'workouts', workoutId), { completedExerciseIds, completedSetIds, completedAt });
}

export async function deleteSavedWorkout(uid, workoutId) {
  await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
}

const WEEK_DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const customWorkoutsRef = (uid) => collection(db, 'users', uid, 'customWorkouts');
const weeklyRoutineRef = (uid) => doc(db, 'users', uid, 'trainingSchedules', 'weekly');

export async function listCustomWorkouts(uid) {
  const snapshot = await getDocs(customWorkoutsRef(uid));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
}

export async function saveCustomWorkout(uid, workout, workoutId = null) {
  const payload = {
    title: workout.title.trim(), muscle: workout.muscle || 'Corpo todo',
    level: workout.level || 'Iniciante', duration: Number(workout.duration) || 30,
    place: workout.place || 'Em casa', equipment: Array.isArray(workout.equipment) ? workout.equipment : ['Peso corporal'],
    exercises: workout.exercises, updatedAt: serverTimestamp(),
  };
  if (workoutId) {
    await updateDoc(doc(db, 'users', uid, 'customWorkouts', workoutId), payload);
    return { id: workoutId, ...payload };
  }
  const saved = await addDoc(customWorkoutsRef(uid), { ...payload, createdAt: serverTimestamp() });
  return { id: saved.id, ...payload };
}

export async function deleteCustomWorkout(uid, workoutId) {
  await deleteDoc(doc(db, 'users', uid, 'customWorkouts', workoutId));
  const routine = await getWeeklyRoutine(uid);
  const days = Object.fromEntries(WEEK_DAYS.map((day) => [day, routine.days[day].filter((id) => id !== workoutId)]));
  await setWeeklyRoutine(uid, days);
}

export async function getWeeklyRoutine(uid) {
  const snapshot = await getDoc(weeklyRoutineRef(uid));
  const savedDays = snapshot.exists() ? snapshot.data().days || {} : {};
  return { days: Object.fromEntries(WEEK_DAYS.map((day) => [day, Array.isArray(savedDays[day]) ? savedDays[day] : []])) };
}

export async function setWeeklyRoutine(uid, days) {
  const normalized = Object.fromEntries(WEEK_DAYS.map((day) => [day, Array.isArray(days[day]) ? days[day].slice(0, 1) : []]));
  await setDoc(weeklyRoutineRef(uid), { days: normalized, updatedAt: serverTimestamp() });
}

export async function startCustomWorkout(uid, plan) {
  const exercises = plan.exercises.map((exercise, index) => ({
    id: exercise.id || `custom-${index + 1}`, name: exercise.name,
    sets: Math.max(1, Math.min(10, Number(exercise.sets) || 3)),
    reps: String(exercise.reps || '10–12'),
    rest_seconds: Math.max(0, Math.min(300, Number(exercise.rest_seconds) || 60)),
    instructions: String(exercise.instructions || ''),
  }));
  const requestedDuration = Number(plan.duration) || 30;
  const duration = [20, 30, 45, 60].reduce((best, value) => Math.abs(value - requestedDuration) < Math.abs(best - requestedDuration) ? value : best, 20);
  const workout = {
    title: plan.title, muscle: plan.muscle || 'Corpo todo', place: plan.place || 'Em casa',
    equipment: Array.isArray(plan.equipment) ? plan.equipment : ['Peso corporal'], duration,
    level: plan.level || 'Iniciante', exercises, completedExerciseIds: [], completedSetIds: [],
    completedAt: null, createdAt: serverTimestamp(),
  };
  const saved = await addDoc(collection(db, 'users', uid, 'workouts'), workout);
  return { ...workout, id: saved.id };
}

export async function listExercises() {
  const snapshot = await getDocs(collection(db, 'exercises'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function saveExercise(exercise, exerciseId) {
  const data = { ...exercise, level: Number(exercise.level), rest_seconds: Number(exercise.rest_seconds) || 60, updatedAt: serverTimestamp() };
  delete data.id;
  if (exerciseId) await updateDoc(doc(db, 'exercises', exerciseId), data);
  else await addDoc(collection(db, 'exercises'), { ...data, createdAt: serverTimestamp() });
}

export async function deleteExercise(exerciseId) {
  await deleteDoc(doc(db, 'exercises', exerciseId));
}

export async function listProfessionalsByVerification(verified) {
  const snapshot = await getDocs(collection(db, 'professionals'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => (item.verified === true) === verified)
    .sort((first, second) => (first.name || '').localeCompare(second.name || '', 'pt-BR'));
}

export async function setProfessionalVerification(professionalId, verified) {
  await updateDoc(doc(db, 'professionals', professionalId), { verified: Boolean(verified), updatedAt: serverTimestamp() });
}

const ACCOUNT_PAGE_SIZE = 50;

export async function listRegisteredUsers(cursor = null) {
  const constraints = [orderBy(documentId())];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(ACCOUNT_PAGE_SIZE));
  const snapshot = await getDocs(query(collection(db, 'users'), ...constraints));
  return {
    users: snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })),
    cursor: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.size === ACCOUNT_PAGE_SIZE,
  };
}
