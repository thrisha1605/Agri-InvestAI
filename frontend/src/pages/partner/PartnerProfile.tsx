import { useEffect, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/BackButton";
import { authService } from "@/lib/auth";
import { getPartnerRequestsForPartner } from "@/lib/appData";
import { fetchPartnerProfile, getPartnerProfile, persistPartnerProfile } from "@/lib/partnerProfile";
import { toast } from "sonner";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function PartnerProfile() {
  const user = authService.getCurrentUser();
  const partnerId = user?.id || "";

  const [profileSnapshot, setProfileSnapshot] = useState(() => getPartnerProfile(partnerId));
  const [headline, setHeadline] = useState(profileSnapshot.headline);
  const [bio, setBio] = useState(profileSnapshot.bio);
  const [experienceYears, setExperienceYears] = useState(String(profileSnapshot.experienceYears || 0));
  const [skills, setSkills] = useState(profileSnapshot.skills.join(", "));
  const [districts, setDistricts] = useState(profileSnapshot.districts);
  const [aadhaarNumber, setAadhaarNumber] = useState(profileSnapshot.aadhaarNumber);
  const [aadhaarFileName, setAadhaarFileName] = useState(profileSnapshot.aadhaarFileName);
  const [certificateFileNames, setCertificateFileNames] = useState(profileSnapshot.certificateFileNames);
  const [additionalDocumentNames, setAdditionalDocumentNames] = useState(profileSnapshot.additionalDocumentNames);
  const [bankProofFileName, setBankProofFileName] = useState(profileSnapshot.bankProofFileName);
  const [upiId, setUpiId] = useState(profileSnapshot.upiId);
  const [paytmNumber, setPaytmNumber] = useState(profileSnapshot.paytmNumber);
  const [photoDataUrl, setPhotoDataUrl] = useState(profileSnapshot.photoDataUrl);
  const [saving, setSaving] = useState(false);

  const requests = partnerId ? getPartnerRequestsForPartner(partnerId) : [];

  useEffect(() => {
    if (!partnerId) {
      return;
    }

    let mounted = true;

    void fetchPartnerProfile(partnerId).then((profile) => {
      if (!mounted) return;
      setProfileSnapshot(profile);
      setHeadline(profile.headline);
      setBio(profile.bio);
      setExperienceYears(String(profile.experienceYears || 0));
      setSkills(profile.skills.join(", "));
      setDistricts(profile.districts);
      setAadhaarNumber(profile.aadhaarNumber);
      setAadhaarFileName(profile.aadhaarFileName);
      setCertificateFileNames(profile.certificateFileNames);
      setAdditionalDocumentNames(profile.additionalDocumentNames);
      setBankProofFileName(profile.bankProofFileName);
      setUpiId(profile.upiId);
      setPaytmNumber(profile.paytmNumber);
      setPhotoDataUrl(profile.photoDataUrl);
    });

    return () => {
      mounted = false;
    };
  }, [partnerId]);

  if (!user) return null;

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read profile photo.");
    }
  };

  const handleSingleFileName = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(file.name);
  };

  const handleMultiFileName = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string[]) => void
  ) => {
    const files = Array.from(event.target.files || []);
    setter(files.map((file) => file.name));
  };

  const saveProfile = async () => {
    setSaving(true);

    try {
      const profile = await persistPartnerProfile({
        ...profileSnapshot,
        userId: partnerId,
        headline,
        bio,
        experienceYears: Number(experienceYears || 0),
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        districts,
        aadhaarNumber,
        aadhaarFileName,
        certificateFileNames,
        additionalDocumentNames,
        bankProofFileName,
        upiId,
        paytmNumber,
        photoDataUrl,
        updatedAt: new Date().toISOString(),
        completionPercent: profileSnapshot.completionPercent,
        readyForProjects: profileSnapshot.readyForProjects,
      });
      setProfileSnapshot(profile);

      toast.success(
        profile.readyForProjects
          ? "Profile saved. You are now ready to request project work."
          : "Profile saved. Upload remaining documents to unlock project work."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save partner profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <BackButton />

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardContent className="bg-slate-950 p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Partner Verification Center</p>
              <h1 className="mt-3 text-3xl font-bold">Complete your agri-partner profile</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Upload your photo, Aadhaar, certificates, and payout details so you can work on projects, receive monthly salary,
                and withdraw earnings from your wallet.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Requests sent</p>
                  <p className="mt-2 text-2xl font-bold">{requests.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Accepted projects</p>
                  <p className="mt-2 text-2xl font-bold">
                    {requests.filter((request) => request.status === "APPROVED").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Profile completion</p>
                  <p className="mt-2 text-2xl font-bold">{profileSnapshot.completionPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80">
            <CardHeader>
              <CardTitle>Current Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>{photoDataUrl ? "Photo added" : "Add a professional profile photo"}</p>
              <p>{aadhaarFileName ? "Aadhaar uploaded" : "Upload Aadhaar card proof"}</p>
              <p>
                {certificateFileNames.length > 0
                  ? `${certificateFileNames.length} certificate file(s) uploaded`
                  : "Upload agriculture, field, or skill certificates"}
              </p>
              <p>{bankProofFileName || upiId || paytmNumber ? "Payout details added" : "Add bank or wallet payout details"}</p>
              <p>{headline.trim() && bio.trim() ? "Professional intro completed" : "Add your headline and bio"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partner-name">Full Name</Label>
                  <Input id="partner-name" value={user.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-phone">Phone</Label>
                  <Input id="partner-phone" value={user.phone} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="Field supervisor • Crop care • On-ground support"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Tell farmers and admins about your field skills, experience, and strengths."
                  rows={5}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    value={experienceYears}
                    onChange={(event) => setExperienceYears(event.target.value)}
                    type="number"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="districts">Preferred Districts / Area</Label>
                  <Input
                    id="districts"
                    value={districts}
                    onChange={(event) => setDistricts(event.target.value)}
                    placeholder="Bengaluru Rural, Kolar, Mysuru..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                  placeholder="Irrigation, crop scouting, disease support, field reporting"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo & Verification Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-photo">Profile Photo</Label>
                <Input id="profile-photo" type="file" accept="image/*" onChange={handlePhotoChange} />
                {photoDataUrl && (
                  <img
                    src={photoDataUrl}
                    alt="Partner profile"
                    className="mt-3 h-40 w-40 rounded-2xl object-cover border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar-number">Aadhaar Number</Label>
                <Input
                  id="aadhaar-number"
                  value={aadhaarNumber}
                  onChange={(event) => setAadhaarNumber(event.target.value)}
                  placeholder="XXXX XXXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar-file">Aadhaar Card File</Label>
                <Input
                  id="aadhaar-file"
                  type="file"
                  onChange={(event) => handleSingleFileName(event, setAadhaarFileName)}
                />
                {aadhaarFileName && <p className="text-sm text-green-700">{aadhaarFileName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificates">Certificates</Label>
                <Input
                  id="certificates"
                  type="file"
                  multiple
                  onChange={(event) => handleMultiFileName(event, setCertificateFileNames)}
                />
                {certificateFileNames.length > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    {certificateFileNames.map((name) => (
                      <p key={name}>{name}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="other-docs">Other Supporting Documents</Label>
                <Input
                  id="other-docs"
                  type="file"
                  multiple
                  onChange={(event) => handleMultiFileName(event, setAdditionalDocumentNames)}
                />
                {additionalDocumentNames.length > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    {additionalDocumentNames.map((name) => (
                      <p key={name}>{name}</p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payout & Earnings Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                placeholder="name@upi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paytm-number">Paytm Number</Label>
              <Input
                id="paytm-number"
                value={paytmNumber}
                onChange={(event) => setPaytmNumber(event.target.value)}
                placeholder="Paytm linked mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-proof">Bank / Payout Proof</Label>
              <Input
                id="bank-proof"
                type="file"
                onChange={(event) => handleSingleFileName(event, setBankProofFileName)}
              />
              {bankProofFileName && <p className="text-sm text-green-700">{bankProofFileName}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => void saveProfile()} disabled={saving} className="min-w-40">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
