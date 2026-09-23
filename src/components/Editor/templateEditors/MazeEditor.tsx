import { getMazeLevel, MAZE_LEVELS } from '../../../maze'
import type { MazeCarver, MazeDeadEnds, MazeEnds } from '../../../maze'
import type { WorksheetState } from '../../../types/worksheet'

const MAZE_CARVERS: { value: MazeCarver; label: string }[] = [
  { value: 'random', label: 'Losowo' },
  { value: 'winding', label: 'Kręte' },
  { value: 'branching', label: 'Rozgałęzione' },
]

const MAZE_DEAD_ENDS: { value: MazeDeadEnds; label: string }[] = [
  { value: 'many', label: 'Dużo' },
  { value: 'few', label: 'Mało' },
  { value: 'none', label: 'Brak' },
]

const MAZE_ENDS: { value: MazeEnds; label: string }[] = [
  { value: 'random', label: 'Losowo' },
  { value: 'corners', label: 'W rogach' },
  { value: 'edges', label: 'Na krawędziach' },
]

/** Ustawienia labiryntu. */
export function MazeEditor({ worksheet, onMazeLevelChange, onMazeOptionsChange }: { worksheet: WorksheetState; onMazeLevelChange: (level: number) => void; onMazeOptionsChange: (options: Partial<WorksheetState>) => void }) {
  return (
    <>
    <section>
      <h2 className="text-lg font-semibold mb-2">Labirynt</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poziom trudności: {getMazeLevel(worksheet.mazeLevel).label}
          </label>
          <input
            type="range"
            min={MAZE_LEVELS[0].value}
            max={MAZE_LEVELS[MAZE_LEVELS.length - 1].value}
            step={1}
            value={worksheet.mazeLevel ?? 2}
            onChange={(event) => onMazeLevelChange(Number(event.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Labirynt zawsze wypełnia całą kartkę - wyższy poziom to gęstsza siatka i dłuższa droga.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kształt korytarzy</label>
          <div className="flex gap-2">
            {MAZE_CARVERS.map((carver) => (
              <button
                key={carver.value}
                type="button"
                onClick={() => onMazeOptionsChange({ mazeCarver: carver.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mazeCarver ?? 'random') === carver.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {carver.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Kręte to długie korytarze z licznymi zakrętami, rozgałęzione to krótkie odnogi. Losowo
            daje każdemu wariantowi inny charakter.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ślepe uliczki</label>
          <div className="flex gap-2">
            {MAZE_DEAD_ENDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onMazeOptionsChange({ mazeDeadEnds: option.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mazeDeadEnds ?? 'many') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Bez ślepych uliczek labirynt ma pętle i kilka dróg do mety - jest łatwiejszy, ale mniej podchwytliwy.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start i meta</label>
          <div className="flex gap-2">
            {MAZE_ENDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onMazeOptionsChange({ mazeEnds: option.value })}
                className={`flex-1 py-2 px-2 text-sm rounded-lg border ${(worksheet.mazeEnds ?? 'random') === option.value ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Zaznacz „Pokaż klucz odpowiedzi", aby zobaczyć rozwiązanie. Każdy wariant karty to inny labirynt.
        </p>
      </div>
    </section>
    </>
  )
}
