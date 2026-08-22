'use client'

import { create } from 'zustand'
import type { ExamRoomData, RoomAnnotation } from '@/lib/attempt-service'
import type { HighlightColor } from '@/lib/enums'

/**
 * Trạng thái phòng thi + cơ chế chống mất bài 3 lớp (SPEC F2.5).
 *
 *   Lớp 1  mọi thay đổi ghi ngay vào store + sessionStorage  (đồng bộ, tức thì)
 *   Lớp 2  debounce 3s, POST batch tới /api/attempts/[id]/sync
 *   Lớp 3  khôi phục từ server khi vào lại, hợp nhất với sessionStorage
 *
 * Mất mạng: batch nằm lại trong hàng đợi dirty, tự gửi lại khi có mạng.
 */

export type LocalAnswer = {
  selectedChoiceIds: string[]
  textAnswer: string | null
  isFlagged: boolean
  timeSpent: number
  changedCount: number
}

/**
 * 'blocked' = lỗi VĨNH VIỄN, đã ngừng thử lại (403/404/409/400).
 * Bộ trạng thái cũ chỉ có nhị phân offline/error nên không diễn đạt được tình
 * huống này, và `beforeunload` giam người dùng trong trang với một hàng đợi
 * không bao giờ gửi được.
 */
export type SyncStatus = 'saved' | 'saving' | 'pending' | 'offline' | 'error' | 'blocked'

/** Vì sao lần gửi vừa rồi hỏng — quyết định CÓ thử lại nữa hay không. */
export type SyncFailure = 'offline' | 'retrying' | 'terminal'

type State = {
  attemptId: string
  mode: 'EXAM' | 'PRACTICE'
  answers: Record<string, LocalAnswer>
  annotations: Record<string, RoomAnnotation>

  currentSectionId: string
  currentQuestionId: string | null

  /** id đang chờ gửi lên server */
  dirtyAnswers: Set<string>
  dirtyAnnotations: Set<string>
  deletedAnnotations: Set<string>

  /**
   * Phần đã BẮT ĐẦU phát audio. Server là nguồn sự thật (`RoomSection.audioStarted`);
   * đây là bản sao cục bộ để giao diện phản hồi ngay, không phải nơi lưu trữ.
   */
  audioPlayedSections: Set<string>
  /** Có thay đổi audio chưa gửi lên server hay không */
  dirtyAudio: boolean

  syncStatus: SyncStatus
  lastSyncedAt: number | null

  /**
   * Tăng mỗi khi NGƯỜI DÙNG tạo ra một thay đổi mới.
   *
   * Debounce trong use-sync.ts bám vào bộ đếm này chứ không so sánh số lượng
   * pending như bản cũ. Hai lý do:
   *  • Sửa lại đúng một câu thì `dirtyAnswers` là Set nên size không đổi, bản cũ
   *    bỏ sót hẳn lần sửa đó.
   *  • `requeue()` sau lỗi làm size đổi 0→N, bản cũ hiểu nhầm là "có thay đổi
   *    mới" và hẹn gửi lại sau 3 giây — cùng một lỗi, quay vòng vô hạn.
   * `requeue` CỐ Ý không tăng `dirtyVersion`, nên mọi lần thử lại buộc phải đi
   * qua backoff.
   */
  dirtyVersion: number

  /** Mã lỗi vĩnh viễn gần nhất, để chỉ báo nói đúng chuyện đang xảy ra */
  syncErrorCode: string | null

  /**
   * Phòng đã đóng: bài được nộp ở nơi khác, hoặc server báo hết giờ.
   * Chặn ngay tại store rẻ và kín hơn là đi khoá từng component.
   */
  locked: boolean

  /**
   * false cho tới khi hydrate() chạy xong.
   * Bắt buộc phải có: trước khi hydrate, remainingAtRef còn là 0 nên readClock()
   * trả 0 — đồng hồ sẽ tưởng hết giờ và tự nộp bài trắng ngay khi vừa vào phòng.
   */
  hydrated: boolean

  /** Đồng hồ: mốc do server cấp + tham chiếu đơn điệu để client không gian lận được */
  remainingAtRef: number
  monotonicRef: number
  elapsedAtRef: number

  submitted: boolean
}

type Actions = {
  hydrate: (data: ExamRoomData) => void
  setAnswer: (questionId: string, patch: Partial<LocalAnswer>) => void
  toggleChoice: (questionId: string, choiceId: string, multi: boolean) => void
  setText: (questionId: string, text: string) => void
  toggleFlag: (questionId: string) => void

  /** Ghi nhận một phần đã bắt đầu phát audio. Một chiều: không có hàm gỡ. */
  markAudioStarted: (sectionId: string) => void

  addAnnotation: (a: RoomAnnotation) => void
  updateAnnotation: (id: string, patch: Partial<RoomAnnotation>) => void
  removeAnnotation: (id: string) => void

  goToQuestion: (questionId: string, sectionId: string) => void
  setSection: (sectionId: string) => void

  markSyncing: () => void
  markSynced: (remainingSeconds: number | null) => void
  markFailed: (kind: SyncFailure, code?: string | null) => void
  /** Đóng phòng: không nhận thao tác mới nữa */
  lock: () => void
  takeDirtyBatch: () => {
    answers: { questionId: string; patch: LocalAnswer }[]
    annotations: RoomAnnotation[]
    deleted: string[]
    /** Cả tập, không phải delta — server hợp nhất nên gửi lại vô hại */
    audioPlayedSectionIds: string[]
  }
  hasPending: () => boolean
  setSubmitted: () => void

  /** Giây còn lại (EXAM) hoặc đã trôi (PRACTICE), tính từ mốc đơn điệu */
  readClock: () => number
}

const EMPTY_ANSWER: LocalAnswer = {
  selectedChoiceIds: [],
  textAnswer: null,
  isFlagged: false,
  timeSpent: 0,
  changedCount: 0,
}

function storageKey(attemptId: string) {
  return `exam-room:${attemptId}`
}

/** Lớp 1 — ghi cục bộ tức thì. Lỗi quota không được làm hỏng bài thi. */
function persistLocal(state: State) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      storageKey(state.attemptId),
      JSON.stringify({
        answers: state.answers,
        annotations: state.annotations,
        currentSectionId: state.currentSectionId,
        currentQuestionId: state.currentQuestionId,
        savedAt: Date.now(),
      }),
    )
  } catch {
    // sessionStorage đầy hoặc bị chặn — vẫn còn lớp 2 lo việc lưu
  }
}

function readLocal(attemptId: string) {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(storageKey(attemptId))
    return raw
      ? (JSON.parse(raw) as {
          answers: Record<string, LocalAnswer>
          annotations: Record<string, RoomAnnotation>
          currentSectionId?: string
          currentQuestionId?: string | null
          savedAt?: number
        })
      : null
  } catch {
    return null
  }
}

export function clearLocal(attemptId: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(storageKey(attemptId))
  } catch {
    /* không sao */
  }
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export const useExamStore = create<State & Actions>((set, get) => ({
  attemptId: '',
  mode: 'EXAM',
  answers: {},
  annotations: {},
  currentSectionId: '',
  currentQuestionId: null,
  dirtyAnswers: new Set(),
  dirtyAnnotations: new Set(),
  deletedAnnotations: new Set(),
  audioPlayedSections: new Set(),
  dirtyAudio: false,
  syncStatus: 'saved',
  lastSyncedAt: null,
  dirtyVersion: 0,
  syncErrorCode: null,
  locked: false,
  hydrated: false,
  remainingAtRef: 0,
  monotonicRef: 0,
  elapsedAtRef: 0,
  submitted: false,

  hydrate: (data) => {
    // Lớp 3 — server là nguồn sự thật, sessionStorage bù các thay đổi
    // chưa kịp đồng bộ trước khi tab đóng.
    const serverAnswers: Record<string, LocalAnswer> = {}
    for (const a of data.answers) {
      serverAnswers[a.questionId] = {
        selectedChoiceIds: a.selectedChoiceIds,
        textAnswer: a.textAnswer,
        isFlagged: a.isFlagged,
        timeSpent: a.timeSpent,
        changedCount: a.changedCount,
      }
    }
    const serverAnnotations: Record<string, RoomAnnotation> = {}
    for (const an of data.annotations) serverAnnotations[an.id] = an

    const submittedAlready = data.attempt.status === 'SUBMITTED'

    /*
      BÀI ĐÃ CHẤM THÌ SERVER LÀ NGUỒN SỰ THẬT DUY NHẤT.

      Trang xem lại gọi đúng hàm hydrate này. Nếu vẫn merge bản nháp cục bộ vào, nó
      sẽ hiện những lựa chọn CHƯA TỪNG được chấm, ngay cạnh nhãn đỏ "Sai" tính từ dữ
      liệu server — hai con số trên cùng một màn hình nói hai chuyện khác nhau.

      Chốt ở đây chứ không ở từng nơi gọi, vì có đường không đi qua client chút nào:
      khi server tự chấm một lượt hết hạn, `clearLocal()` phía client không bao giờ
      chạy và khoá `exam-room:<id>` nằm lại nguyên vẹn.
    */
    if (submittedAlready) clearLocal(data.attempt.id)

    const local = submittedAlready ? null : readLocal(data.attempt.id)
    const dirtyAnswers = new Set<string>()
    const dirtyAnnotations = new Set<string>()

    /*
      Bản nháp chỉ được ghi đè server khi nó MỚI HƠN lần đồng bộ gần nhất.

      Bản cũ ghi đè bất cứ khi nào giá trị khác nhau, tức là "ai ghi sau thắng" — mà
      "sau" ở đây là thứ tự mở tab, không phải thứ tự thao tác. sessionStorage riêng
      từng tab còn server thì chung, nên tab mở từ sáng khi được focus lại sẽ đè bản
      nháp buổi sáng lên đáp án tab kia vừa làm.

      So đồng hồ tường của client với mốc của server nên có sai lệch. Đánh đổi có
      chủ đích: bản nháp mới hơn vài giây bị bỏ qua thì mất một lần ghi đè đúng, còn
      bản nháp cũ đè lên bài mới là mất dữ liệu thật.
    */
    const localIsFresher =
      local?.savedAt !== undefined && local.savedAt > Date.parse(data.attempt.lastSyncAt)

    if (local && localIsFresher) {
      for (const [qid, ans] of Object.entries(local.answers ?? {})) {
        const server = serverAnswers[qid]
        const differs =
          !server ||
          server.textAnswer !== ans.textAnswer ||
          server.isFlagged !== ans.isFlagged ||
          server.selectedChoiceIds.join(',') !== ans.selectedChoiceIds.join(',')
        if (differs) {
          serverAnswers[qid] = ans
          dirtyAnswers.add(qid) // chưa lên server -> gửi lại
        }
      }
      for (const [id, an] of Object.entries(local.annotations ?? {})) {
        if (!serverAnnotations[id]) {
          serverAnnotations[id] = an
          dirtyAnnotations.add(id)
        }
      }
    }

    const firstSection = data.sections[0]
    const sectionId =
      data.attempt.currentSectionId ?? local?.currentSectionId ?? firstSection?.id ?? ''
    const section = data.sections.find((s) => s.id === sectionId) ?? firstSection

    set({
      attemptId: data.attempt.id,
      mode: data.attempt.mode,
      answers: serverAnswers,
      annotations: serverAnnotations,
      currentSectionId: section?.id ?? '',
      currentQuestionId: local?.currentQuestionId ?? section?.questions[0]?.id ?? null,
      dirtyAnswers,
      dirtyAnnotations,
      deletedAnnotations: new Set(),
      // Server là nguồn sự thật cho audio: nạp thẳng, không merge với bản cục bộ nào
      audioPlayedSections: new Set(
        data.sections.filter((s) => s.audioStarted).map((s) => s.id),
      ),
      dirtyAudio: false,
      syncStatus: dirtyAnswers.size + dirtyAnnotations.size > 0 ? 'pending' : 'saved',
      // Attempt mới thì mọi cờ khoá và lỗi của attempt cũ phải sạch — store là
      // singleton cấp module, sống sót qua điều hướng client-side.
      dirtyVersion: 0,
      syncErrorCode: null,
      locked: data.attempt.status === 'SUBMITTED',
      remainingAtRef: data.attempt.remainingSeconds,
      elapsedAtRef: data.attempt.timeSpent,
      monotonicRef: now(),
      submitted: data.attempt.status === 'SUBMITTED',
      hydrated: true,
    })
  },

  setAnswer: (questionId, patch) => {
    // Phòng đã đóng (nộp rồi, hoặc bài đã nộp ở tab khác): không nhận thao tác
    // mới. Nhận thêm chỉ tạo ra hàng đợi không bao giờ gửi được, tệ hơn nữa là
    // ghi đè lên bài đã chấm.
    if (get().locked || get().submitted) return
    set((s) => {
      const prev = s.answers[questionId] ?? EMPTY_ANSWER
      const next = { ...prev, ...patch }
      const answers = { ...s.answers, [questionId]: next }
      const dirtyAnswers = new Set(s.dirtyAnswers).add(questionId)
      const state = { ...s, answers, dirtyAnswers, syncStatus: 'pending' as SyncStatus }
      persistLocal(state)
      return { answers, dirtyAnswers, syncStatus: 'pending', dirtyVersion: s.dirtyVersion + 1 }
    })
  },

  toggleChoice: (questionId, choiceId, multi) => {
    const prev = get().answers[questionId] ?? EMPTY_ANSWER
    let selected: string[]
    if (multi) {
      selected = prev.selectedChoiceIds.includes(choiceId)
        ? prev.selectedChoiceIds.filter((c) => c !== choiceId)
        : [...prev.selectedChoiceIds, choiceId]
    } else {
      selected = prev.selectedChoiceIds[0] === choiceId ? [] : [choiceId]
    }
    /*
      changedCount = số lần ĐỔI Ý, không phải số lần chạm vào câu hỏi (SPEC 3.3).

      Chỉ tính khi lựa chọn cũ bị THAY THẾ bằng một lựa chọn khác. Bản cũ tăng bất
      cứ khi nào đã có lựa chọn nào đó, nên ở MULTI_CHOICE việc tick thêm ô thứ hai
      — hành vi bình thường của dạng câu nhiều đáp án — cũng bị ghi là đổi ý, và
      dữ liệu phân tích trở thành thứ không đọc được.
    */
    const replacedPrevious = !multi && prev.selectedChoiceIds[0] !== undefined && prev.selectedChoiceIds[0] !== choiceId
    const changed = replacedPrevious ? prev.changedCount + 1 : prev.changedCount
    get().setAnswer(questionId, { selectedChoiceIds: selected, changedCount: changed })
  },

  setText: (questionId, text) => {
    get().setAnswer(questionId, { textAnswer: text })
  },

  toggleFlag: (questionId) => {
    const prev = get().answers[questionId] ?? EMPTY_ANSWER
    get().setAnswer(questionId, { isFlagged: !prev.isFlagged })
  },

  /*
    MỘT CHIỀU, và cố ý không có hàm gỡ.

    Không kiểm tra `locked`/`submitted` như các action khác: đây không phải bài làm
    của thí sinh mà là ghi nhận một sự kiện đã xảy ra. Bỏ qua nó ở trạng thái biên
    nào cũng là mở đường nghe lại.
  */
  markAudioStarted: (sectionId) => {
    set((s) => {
      if (s.audioPlayedSections.has(sectionId)) return s
      return {
        audioPlayedSections: new Set(s.audioPlayedSections).add(sectionId),
        dirtyAudio: true,
        syncStatus: 'pending',
        dirtyVersion: s.dirtyVersion + 1,
      }
    })
  },

  addAnnotation: (a) => {
    if (get().locked || get().submitted) return
    set((s) => {
      const annotations = { ...s.annotations, [a.id]: a }
      const dirtyAnnotations = new Set(s.dirtyAnnotations).add(a.id)
      persistLocal({ ...s, annotations })
      return { annotations, dirtyAnnotations, syncStatus: 'pending', dirtyVersion: s.dirtyVersion + 1 }
    })
  },

  updateAnnotation: (id, patch) => {
    if (get().locked || get().submitted) return
    set((s) => {
      const existing = s.annotations[id]
      if (!existing) return s
      const annotations = { ...s.annotations, [id]: { ...existing, ...patch } }
      const dirtyAnnotations = new Set(s.dirtyAnnotations).add(id)
      persistLocal({ ...s, annotations })
      return { annotations, dirtyAnnotations, syncStatus: 'pending', dirtyVersion: s.dirtyVersion + 1 }
    })
  },

  removeAnnotation: (id) => {
    if (get().locked || get().submitted) return
    set((s) => {
      const annotations = { ...s.annotations }
      delete annotations[id]
      const dirtyAnnotations = new Set(s.dirtyAnnotations)
      dirtyAnnotations.delete(id)
      const deletedAnnotations = new Set(s.deletedAnnotations).add(id)
      persistLocal({ ...s, annotations })
      return {
        annotations,
        dirtyAnnotations,
        deletedAnnotations,
        syncStatus: 'pending',
        dirtyVersion: s.dirtyVersion + 1,
      }
    })
  },

  goToQuestion: (questionId, sectionId) => {
    set((s) => {
      const next = { ...s, currentQuestionId: questionId, currentSectionId: sectionId }
      persistLocal(next)
      return { currentQuestionId: questionId, currentSectionId: sectionId }
    })
  },

  setSection: (sectionId) => {
    set((s) => {
      const next = { ...s, currentSectionId: sectionId }
      persistLocal(next)
      return { currentSectionId: sectionId }
    })
  },

  markSyncing: () => set({ syncStatus: 'saving' }),

  markSynced: (remainingSeconds) => {
    set((s) => {
      const base = {
        syncStatus: (s.dirtyAnswers.size + s.dirtyAnnotations.size + s.deletedAnnotations.size > 0
          ? 'pending'
          : 'saved') as SyncStatus,
        lastSyncedAt: Date.now(),
        syncErrorCode: null,
      }
      if (remainingSeconds === null) return base

      /*
        PRACTICE đếm LÊN: readClock() = elapsedAtRef + (now() - monotonicRef).
        Đặt lại monotonicRef mà không dời elapsedAtRef lên theo là ném đồng hồ về
        đúng mốc lúc hydrate — SAU MỖI LẦN SYNC, không phải chỉ sau khi tải lại.
        Server trả remainingSeconds cho cả hai chế độ nên nhánh này chạy liên tục.
      */
      if (s.mode === 'PRACTICE') {
        return {
          ...base,
          elapsedAtRef: Math.floor(s.elapsedAtRef + (now() - s.monotonicRef) / 1000),
          monotonicRef: now(),
        }
      }

      // EXAM đếm NGƯỢC từ mốc server cấp — neo lại là đúng, không cộng dồn gì cả
      return { ...base, remainingAtRef: remainingSeconds, monotonicRef: now() }
    })
  },

  markFailed: (kind, code = null) =>
    set({
      syncStatus: kind === 'offline' ? 'offline' : kind === 'terminal' ? 'blocked' : 'error',
      syncErrorCode: code,
    }),

  lock: () => set({ locked: true }),

  takeDirtyBatch: () => {
    const s = get()
    const answers = [...s.dirtyAnswers]
      .map((qid) => ({ questionId: qid, patch: s.answers[qid] }))
      .filter((a) => a.patch !== undefined)
    const annotations = [...s.dirtyAnnotations]
      .map((id) => s.annotations[id])
      .filter((a): a is RoomAnnotation => a !== undefined)
    const deleted = [...s.deletedAnnotations]
    // Gửi CẢ TẬP, không phải delta: tập chỉ có vài phần tử, server hợp nhất, nên
    // gửi lại là vô hại và không cần theo dõi phần tử nào đã đi phần tử nào chưa.
    const audioPlayedSectionIds = s.dirtyAudio ? [...s.audioPlayedSections] : []

    // Xoá cờ dirty NGAY khi lấy batch; nếu gửi lỗi thì đánh dấu lại (xem useSync)
    set({
      dirtyAnswers: new Set(),
      dirtyAnnotations: new Set(),
      deletedAnnotations: new Set(),
      dirtyAudio: false,
    })
    return { answers, annotations, deleted, audioPlayedSectionIds }
  },

  hasPending: () => {
    const s = get()
    /*
      Đã nộp, hoặc lỗi vĩnh viễn: thử lại cũng vô ích. Bật beforeunload lúc này
      là giam thí sinh trong trang mà không cho họ lối nào ra — đúng triệu chứng
      của lỗi A4 khi hết giờ hoặc mở hai tab.
    */
    if (s.submitted || s.syncStatus === 'blocked') return false
    return (
      s.dirtyAudio ||
      s.dirtyAnswers.size + s.dirtyAnnotations.size + s.deletedAnnotations.size > 0 ||
      s.syncStatus === 'saving' ||
      s.syncStatus === 'offline' ||
      s.syncStatus === 'error'
    )
  },

  setSubmitted: () =>
    set({ submitted: true, locked: true, syncStatus: 'saved', syncErrorCode: null }),

  readClock: () => {
    const s = get()
    const elapsedSinceRef = (now() - s.monotonicRef) / 1000
    if (s.mode === 'PRACTICE') return Math.floor(s.elapsedAtRef + elapsedSinceRef)
    return Math.max(0, Math.floor(s.remainingAtRef - elapsedSinceRef))
  },
}))

/**
 * Ghép batch thất bại trở lại hàng đợi dirty để lần sau gửi tiếp.
 *
 * Chỉ ghi lại ID — giá trị được đọc lại từ store lúc gửi. Nhờ vậy một batch cũ
 * gửi lại KHÔNG BAO GIỜ đè lên chỉnh sửa mới hơn người dùng vừa làm trong lúc
 * request kia còn bay. Giữ nguyên tính chất này.
 *
 * CỐ Ý không tăng `dirtyVersion`: thử lại là việc của backoff trong use-sync.ts,
 * không phải của debounce. Bản cũ không tách hai thứ đó nên requeue tự kích hoạt
 * lần gửi kế tiếp sau đúng 3 giây, và một lỗi vĩnh viễn thành vòng lặp bất tận.
 */
export function requeue(batch: {
  answers: { questionId: string; patch: LocalAnswer }[]
  annotations: RoomAnnotation[]
  deleted: string[]
  audioPlayedSectionIds: string[]
}) {
  useExamStore.setState((s) => {
    // Bài đã nộp: xếp hàng thêm chỉ để bật lại cảnh báo beforeunload một cách vô ích
    if (s.submitted) return s
    const dirtyAnswers = new Set(s.dirtyAnswers)
    for (const a of batch.answers) dirtyAnswers.add(a.questionId)
    const dirtyAnnotations = new Set(s.dirtyAnnotations)
    for (const an of batch.annotations) dirtyAnnotations.add(an.id)
    const deletedAnnotations = new Set(s.deletedAnnotations)
    for (const id of batch.deleted) deletedAnnotations.add(id)
    return {
      dirtyAnswers,
      dirtyAnnotations,
      deletedAnnotations,
      dirtyAudio: s.dirtyAudio || batch.audioPlayedSectionIds.length > 0,
    }
  })
}

export { HIGHLIGHT_COLORS_LIST }
const HIGHLIGHT_COLORS_LIST: HighlightColor[] = ['yellow', 'green', 'blue', 'pink']
