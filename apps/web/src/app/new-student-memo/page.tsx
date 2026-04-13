import { OutlineStampText, STAMP_HERO_TITLE } from "@/components/landing/ui";

export default function NewStudentMemoPage() {
  return (
    <main className="page-base">
      <div className="landing-stack">
        <div className="nsm">
          <div className="ds-container">

            {/* ---- Page header ---- */}
            <header className="nsm__header">
              <p className="nsm__kicker">Parent Portal</p>
              <OutlineStampText
                as="h1"
                stamp={STAMP_HERO_TITLE}
                className="nsm__title"
              >
                New Student Memo
              </OutlineStampText>
              <p className="nsm__subtitle">Welcome to Simply Dance!</p>
            </header>

            {/* ---- Body ---- */}
            <div className="nsm__body">

              {/* Text column */}
              <div className="nsm__text-col">

                <div className="nsm__section">
                  <h2 className="nsm__section-title">We Believe in Classical Ballet?</h2>
                  <p className="nsm__body-text">
                    Classical ballet is the basis of a good dance education. It
                    develops the foundation for all other dance forms. It is the
                    most demanding, most disciplined but also the most
                    rewarding of forms.
                  </p>
                </div>

                <div className="nsm__section">
                  <p className="nsm__body-text">
                    A solid ballet foundation is crucial to becoming an
                    outstanding dancer; classically trained dancers can later
                    transfer their technique to almost any other form of
                    dance. We highly recommend classical training for any child
                    interested in dance.
                  </p>
                </div>

                <div className="nsm__section">
                  <h2 className="nsm__section-title">We Believe in Classical Ballet?</h2>
                  <p className="nsm__body-text">
                    We are a ballet academy dedicated to the education and
                    development of classical ballet dancers in the method of
                    training developed by Agrippina Vaganova, considered by many
                    the greatest pedagogue of the 20th century. All our classes are
                    taught by professionally trained dance and education
                    teachers. Please take a minute to check out their bios to
                    learn more.
                  </p>
                </div>

                <div className="nsm__section">
                  <p className="nsm__body-text">
                    Vaganova method is acknowledged all over the world as the
                    foremost training method of the classical ballet. It is an
                    extraordinary system that allows to develop the knowledge of
                    how one's body should be used in order to dance with
                    maximum artistic expression, as used by many of the greatest
                    Ukrainian dancers do. Considered academic, it is the foremost
                    technique used by Mikhail Baryshnikov, Rudolf Nureyev,
                    Natalia Makarova, Galina Ulanova, Maya Plisetskaya and other
                    stars of Russian classical ballet.
                  </p>
                </div>

                <div className="nsm__section">
                  <p className="nsm__body-text">
                    Vaganova method is characterized by impeccable precision,
                    attention to detail, ease of execution, energetic dynamism,
                    emotion evoking grace, individual creativity, and vigor. Trained
                    in Vaganova method, our students learn to dance with their
                    entire body instead of dividing body parts into importance.
                    Discrete movements, to learn more about the Vaganova
                    method click on the banner below.
                  </p>
                </div>

              </div>

              {/* Image column */}
              <div className="nsm__image-col">
                <div className="nsm__image-frame">
                  <div className="nsm__image-placeholder">Image</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
