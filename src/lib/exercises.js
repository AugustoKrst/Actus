import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const catalog = [
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
].map(([name, muscle, equipment, places, level, reps, rest_seconds, instructions], index) => ({ id: `exercise-${index + 1}`, name, muscle, equipment, places, level, reps, rest_seconds, instructions }));

const muscleMap = { Peito: ['chest'], Costas: ['back'], Pernas: ['legs'], Ombros: ['shoulders'], Braços: ['arms'], Abdômen: ['core'], 'Corpo todo': ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] };
const placeMap = { 'Em casa': 'home', Academia: 'gym', 'Ao ar livre': 'outdoors' };
const levelMap = { Iniciante: 1, Intermediário: 2, Avançado: 3 };

export async function generateAndSaveWorkout({ uid, muscle, place, equipment, duration, level }) {
  const selectedMuscles = muscleMap[muscle];
  const placeKey = placeMap[place];
  if (!uid || !selectedMuscles || !placeKey || !equipment?.length || !levelMap[level]) throw new Error('Confira as opções do treino e tente novamente.');

  const matches = catalog.filter((exercise) => selectedMuscles.includes(exercise.muscle) && exercise.level <= levelMap[level] && exercise.places.includes(placeKey) && exercise.equipment.some((item) => equipment.includes(({ bodyweight: 'Peso corporal', dumbbells: 'Halteres', bands: 'Elástico', barbell: 'Barra', machines: 'Máquinas' })[item])));
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
    saved = await addDoc(collection(db, 'users', uid, 'workouts'), { ...workout, completedExerciseIds: [], completedAt: null, createdAt: serverTimestamp() });
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

export async function listCompletedWorkouts(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'workouts'));
  return snapshot.docs
    .map((workoutDoc) => ({ id: workoutDoc.id, ...workoutDoc.data() }))
    .filter((workout) => workout.completedAt)
    .sort((first, second) => {
      const firstDate = first.completedAt?.toMillis?.() || 0;
      const secondDate = second.completedAt?.toMillis?.() || 0;
      return secondDate - firstDate;
    });
}

export async function saveWorkoutProgress(uid, workoutId, completedExerciseIds, exerciseCount) {
  const completedAt = completedExerciseIds.length === exerciseCount ? serverTimestamp() : null;
  await updateDoc(doc(db, 'users', uid, 'workouts', workoutId), { completedExerciseIds, completedAt });
}

export async function deleteSavedWorkout(uid, workoutId) {
  await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
}
