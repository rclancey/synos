package api

import (
	"log"
	"net/http"
	//"strings"
	"time"

	//"github.com/pkg/errors"

	"github.com/rclancey/synos/cron"
	H "github.com/rclancey/httpserver/v2"
)

func CronAPI(router H.Router, authmw H.Middleware) {
	router.GET("/cron", authmw(H.HandlerFunc(LoadSchedule)))
	router.POST("/cron", authmw(H.HandlerFunc(UpdateSchedule)))
}

var sched *cron.Schedule

func init() {
	sched = cron.NewSchedule()
	sched.Run()
}

const (
	SleepJob = 1
	WakeJob = 2
)

func ScheduleFromConfig(cfg *CronConfig) {
	for i, j := range *cfg {
		if j == nil {
			continue
		}
		if j.Wake != nil {
			ji := SetWake(time.Weekday(i), j.Wake.Time, j.Wake.PlaylistID)
			if j.Wake.Override != nil {
				t := time.Unix(*j.Wake.Override / 1000, 0)
				if t.After(time.Now()) {
					sched.OverrideJob(ji, t)
				}
			}
		}
		if j.Sleep != nil {
			ji := SetSleep(time.Weekday(i), j.Sleep.Time)
			if j.Sleep.Override != nil {
				t := time.Unix(*j.Sleep.Override / 1000, 0)
				if t.After(time.Now()) {
					sched.OverrideJob(ji, t)
				}
			}
		}
	}
}

func ScheduleToConfig() *CronConfig {
	jobs := make([]*DayJob, 7)
	for i := 0; i < 7; i++ {
		jobs[i] = &DayJob{}
	}
	for _, ji := range sched.Jobs() {
		j, ok := ji.(*Job)
		if ok {
			switch j.Kind {
			case WakeJob:
				jobs[int(j.Weekday())].Wake = &WakeTime{
					SleepTime: &SleepTime{Time: j.TimeOfDay()},
					PlaylistID: j.PlaylistID(),
				}
				ot := j.GetOverride()
				if ot != nil {
					ms := ot.Unix() * 1000
					jobs[int(j.Weekday())].Wake.SleepTime.Override = &ms
				}
			case SleepJob:
				jobs[int(j.Weekday())].Sleep = &SleepTime{Time: j.TimeOfDay()}
				ot := j.GetOverride()
				if ot != nil {
					ms := ot.Unix() * 1000
					jobs[int(j.Weekday())].Sleep.Override = &ms
				}
			}
		}
	}
	cfg := CronConfig(jobs)
	return &cfg
}

type Job struct {
	*cron.Job
	Kind int
	playlistId *string
}

func NewSleepJob(wd time.Weekday, tod int) *Job {
	return &Job{
		Job: cron.NewJob(wd, tod, Sleep),
		Kind: SleepJob,
	}
}

func NewWakeJob(wd time.Weekday, tod int, plid *string) *Job {
	return &Job{
		Job: cron.NewJob(wd, tod, MakeWake(plid)),
		Kind: WakeJob,
		playlistId: plid,
	}
}

func (j *Job) PlaylistID() *string {
	if j.Kind == SleepJob {
		return nil
	}
	return j.playlistId
}

func Sleep() {
	client, err := getJooki(false)
	if err == nil && client != nil {
		client.Pause()
	} else {
		log.Println("error connecting to jooki:", err)
	}
}

func MakeWake(plid *string) func() {
	return func() {
		client, err := getJooki(false)
		if err == nil && client != nil {
			if plid == nil || *plid == "" {
				client.Play()
			} else {
				client.PlayPlaylist(*plid, 0)
			}
		} else {
			log.Println("error connecting to jooki:", err)
		}
	}
}

func SetSleep(wd time.Weekday, tod int) cron.JobInterface {
	for _, ji := range sched.Jobs() {
		j, ok := ji.(*Job)
		if !ok || j.Kind != SleepJob {
			continue
		}
		if j.Weekday() == wd {
			sched.RemoveJob(ji)
		}
	}
	j := NewSleepJob(wd, tod)
	sched.AddJob(j)
	cfg.Jooki.SaveCron(ScheduleToConfig())
	return j
}

func SetWake(wd time.Weekday, tod int, plid *string) cron.JobInterface {
	for _, ji := range sched.Jobs() {
		j, ok := ji.(*Job)
		if !ok || j.Kind != WakeJob {
			continue
		}
		if j.Weekday() == wd {
			sched.RemoveJob(ji)
		}
	}
	j := NewWakeJob(wd, tod, plid)
	sched.AddJob(j)
	cfg.Jooki.SaveCron(ScheduleToConfig())
	return j
}

/*
func OverrideSleep(t time.Time) cron.JobInterface {
	sched.Sort()
	for _, ji := range sched.Jobs() {
		j, ok := ji.(*Job)
		if ok && j.Kind == SleepJob {
			sched.OverrideJob(j, t)
			return j
		}
	}
	return nil
}

func OverrideWake(t time.Time) cron.JobInterface {
	sched.Sort(time.Now())
	for _, ji := range sched.Jobs() {
		j, ok := ji.(*Job)
		if ok && j.Kind == WakeJob {
			j.Override(time.Now(), t)
			sched.Run()
			return j
		}
	}
	return nil
}
*/

func CronHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		return ScheduleToConfig(), nil
	case http.MethodPost:
		return UpdateSchedule(w, req)
	/*
	case http.MethodPut:
		return OverrideSchedule(w, req)
	*/
	}
	return nil, H.MethodNotAllowed
}

func LoadSchedule(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	return ScheduleToConfig(), nil
}

func UpdateSchedule(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	cron := &CronConfig{}
	err := H.ReadJSON(req, cron)
	if err != nil {
		return nil, err
	}
	ScheduleFromConfig(cron)
	return ScheduleToConfig(), nil
}

/*
type Override struct {
	Kind string
	Time *int64
	Delta *int64
}

func OverrideSchedule(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	over := &Override{}
	err := H.ReadJSON(req, over)
	if err != nil {
		return nil, err
	}
	var t time.Time
	if over.Time != nil {
		t = time.Unix(*over.Time / 1000, 0)
	} else if over.Delta != nil {
		t = time.Now().Add(time.Duration(*over.Delta) * time.Millisecond)
	} else {
		return nil, errors.New("no time reference provided")
	}
	switch strings.ToLower(over.Kind) {
	case "sleep":
		OverrideSleep(t)
	case "wake":
		OverrideWake(t)
	default:
		return nil, errors.New("unknown schedule type: " + over.Kind)
	}
	return ScheduleToConfig(), nil
}
*/

